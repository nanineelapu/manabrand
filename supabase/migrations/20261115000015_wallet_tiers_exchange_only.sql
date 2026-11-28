-- =============================================================================
-- 0015 · WALLET TIERS ON ITEM VALUE  +  EXCHANGES ONLY
--  · the wallet tier is decided by the value of the ITEMS (subtotal − coupon), not the total with delivery / COD fees,
--    so what the shopper is told ("shop ₹999 or more") is exactly what happens
--  · ManaBrand has no refund policy: delivered items can only be EXCHANGED (request_return refuses anything else)
-- Safe to run more than once (needs 0014 first).
-- =============================================================================

create or replace function public.place_order_wallet(
  p_items jsonb, p_address jsonb, p_payment_method public.payment_method,
  p_coupon text default null, p_express boolean default false, p_wallet int default 0
) returns table (order_id uuid, order_number text, total int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare r record; o record; v_uid uuid := auth.uid(); v_bal int; v_use int; v_total int; v_items int; v_cap int;
begin
  select * into r from public.place_order(p_items, p_address, p_payment_method, p_coupon, p_express);
  v_total := r.total;
  if coalesce(p_wallet, 0) > 0 and v_uid is not null then
    perform pg_advisory_xact_lock(hashtext('wallet:' || v_uid::text));     -- two checkouts at once can't spend the same money
    select coalesce(sum(amount), 0)::int into v_bal from public.wallet_transactions where user_id = v_uid;
    select subtotal, discount into o from public.orders where id = r.order_id;
    v_items := greatest(0, o.subtotal - o.discount);

    -- ₹999+ → 200 · ₹1,499+ → 250 · ₹1,999+ → 300 · ₹2,499+ → 350 · below ₹999 → 0   (keep in step with src/lib/wallet.ts)
    v_cap := case when v_items >= 2499 then 350 when v_items >= 1999 then 300 when v_items >= 1499 then 250 when v_items >= 999 then 200 else 0 end;

    v_use := least(p_wallet, v_bal, v_total, v_cap);
    if v_use > 0 then
      insert into public.wallet_transactions (user_id, amount, kind, order_id, note)
      values (v_uid, -v_use, 'order', r.order_id, 'Used on order ' || r.order_number);
      v_total := v_total - v_use;
      update public.orders set total = v_total, wallet_used = v_use,
             payment_status = case when v_total = 0 then 'paid' else payment_status end,
             payment_ref    = case when v_total = 0 then 'wallet' else payment_ref end
       where id = r.order_id;
      insert into public.order_events (order_id, status, note)
      select id, status, 'Paid ₹' || v_use || ' from wallet' from public.orders where id = r.order_id;
    end if;
  end if;
  return query select r.order_id, r.order_number, v_total;
end $$;

-- exchanges only: a delivered item can be swapped for another size / colour within 7 days, never refunded
create or replace function public.request_return(p_order uuid, p_item uuid, p_type public.return_type, p_reason text, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_o record; v_i record; v_delivered timestamptz; v_id uuid; v_owner uuid;
begin
  if p_type is distinct from 'exchange' then raise exception 'ManaBrand offers exchanges only — no refunds'; end if;
  select * into v_o from public.orders where id = p_order;
  if not found or v_o.user_id is distinct from auth.uid() then raise exception 'Order not found'; end if;
  if v_o.status <> 'delivered' then raise exception 'Only delivered orders can be exchanged'; end if;
  select max(created_at) into v_delivered from public.order_events where order_id = p_order and status = 'delivered';
  if v_delivered is null or v_delivered < now() - interval '7 days' then raise exception 'The 7-day exchange window has closed'; end if;
  select * into v_i from public.order_items where id = p_item and order_id = p_order;
  if not found then raise exception 'Item not found'; end if;
  if exists (select 1 from public.returns where order_item_id = p_item and status not in ('rejected')) then raise exception 'An exchange is already open for this item'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'Please choose a reason'; end if;

  insert into public.returns (order_id, order_item_id, seller_id, user_id, type, reason, note, amount)
  values (p_order, p_item, v_i.seller_id, auth.uid(), 'exchange', p_reason, p_note, v_i.price * v_i.qty) returning id into v_id;
  select owner_id into v_owner from public.sellers where id = v_i.seller_id;
  if v_owner is not null then perform public.notify(v_owner, 'seller', 'order', 'Exchange requested', v_o.number || ' · ' || v_i.name); end if;
  perform public.notify(null, 'admin', 'order', 'Exchange requested', v_o.number || ' · ' || v_i.name);
  return v_id;
end $$;

revoke all on function public.place_order_wallet(jsonb, jsonb, public.payment_method, text, boolean, int) from public, anon;
grant execute on function public.place_order_wallet(jsonb, jsonb, public.payment_method, text, boolean, int) to authenticated;
revoke all on function public.request_return(uuid, uuid, public.return_type, text, text) from public, anon;
grant execute on function public.request_return(uuid, uuid, public.return_type, text, text) to authenticated;

-- completing an exchange ('refunded' is the old name of the final step: "exchange completed") sends the replacement.
-- It never touches the payment — no money goes back — and the order stays "delivered".
create or replace function public.decide_return(p_return uuid, p_status public.return_status) returns void
language plpgsql security definer set search_path = public as $$
declare v_r record; v_admin boolean := public.is_admin(); v_seller boolean;
begin
  select * into v_r from public.returns where id = p_return for update;
  if not found then raise exception 'Exchange not found'; end if;
  v_seller := public.owns_seller(v_r.seller_id);
  if not v_admin and not v_seller then raise exception 'Not allowed' using errcode = '42501'; end if;

  if not (
       (v_r.status = 'requested' and p_status in ('approved', 'rejected'))
    or (v_r.status = 'approved'  and p_status = 'picked_up')
    or (v_r.status = 'picked_up' and p_status = 'refunded' and v_admin)
  ) then raise exception 'That change is not allowed from %', v_r.status; end if;

  update public.returns set status = p_status where id = p_return;
  if p_status = 'refunded' then
    insert into public.order_events (order_id, status, note)
    select v_r.order_id, status, 'Exchange completed — replacement sent' from public.orders where id = v_r.order_id;
  end if;
  perform public.notify(v_r.user_id, 'user', 'order', 'Exchange ' || case when p_status = 'refunded' then 'completed' else replace(p_status::text, '_', ' ') end, 'Your exchange request was updated.');
end $$;

-- an exchanged item is still a sale (the seller sends a replacement), so it stays in the seller's payout
create or replace function public.generate_payouts(p_start date, p_end date) returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_end < p_start then raise exception 'Invalid period'; end if;
  with delivered as (
    select oi.seller_id, oi.price * oi.qty as line, o.id as order_id
    from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.status = 'delivered'
      and (select max(e.created_at)::date from public.order_events e where e.order_id = o.id and e.status = 'delivered') between p_start and p_end
  ), agg as (
    select d.seller_id, count(distinct d.order_id)::int as n, sum(d.line)::int as gross from delivered d group by d.seller_id
  ), ins as (
    insert into public.payouts (seller_id, period_start, period_end, orders_count, gross, commission, net)
    select a.seller_id, p_start, p_end, a.n, a.gross, round(a.gross * s.commission_pct / 100.0)::int,
           a.gross - round(a.gross * s.commission_pct / 100.0)::int
    from agg a join public.sellers s on s.id = a.seller_id
    on conflict (seller_id, period_start, period_end) do nothing returning 1
  ) select count(*) into v_n from ins;
  return v_n;
end $$;

revoke all on function public.decide_return(uuid, public.return_status) from public, anon;
grant execute on function public.decide_return(uuid, public.return_status) to authenticated;
revoke all on function public.generate_payouts(date, date) from public, anon;
grant execute on function public.generate_payouts(date, date) to authenticated;

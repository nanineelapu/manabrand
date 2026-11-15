-- =============================================================================
-- 0005 · BUSINESS LOGIC (security-definer functions)
-- All money/stock/status changes happen HERE, inside one transaction, with the
-- rules enforced by the database — the browser can never set a price or a status.
-- =============================================================================

-- discount % for filtering/sorting without computing in the app
alter table public.products
  add column discount_pct int generated always as (case when mrp > 0 then ((mrp - price) * 100 / mrp) else 0 end) stored;
create index products_discount on public.products (discount_pct);

alter table public.order_items add column image_url text;

-- ---- helpers ----------------------------------------------------------------
create or replace function public.order_rank(s public.order_status) returns int
language sql immutable as $$
  select case s when 'placed' then 1 when 'confirmed' then 2 when 'packed' then 3 when 'shipped' then 4
                when 'out_for_delivery' then 5 when 'delivered' then 6 else 0 end
$$;

create or replace function public.notify(p_user uuid, p_audience text, p_kind text, p_title text, p_body text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, audience, kind, title, body) values (p_user, p_audience, p_kind, p_title, p_body)
$$;
revoke all on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;

-- ---- PLACE ORDER ------------------------------------------------------------
create or replace function public.place_order(
  p_items jsonb, p_address jsonb, p_payment_method public.payment_method,
  p_coupon text default null, p_express boolean default false
) returns table (order_id uuid, order_number text, total int)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_ship jsonb; v_free int; v_std int; v_exp int; v_cod int;
  v_subtotal int := 0; v_discount int := 0; v_shipping int := 0; v_codfee int := 0; v_expfee int := 0; v_total int;
  v_item jsonb; v_p record; v_qty int; v_color text; v_img text;
  v_cp record; v_free_ship boolean := false;
  v_order uuid; v_num text; v_sellers uuid[] := '{}'; v_owner uuid;
begin
  if v_uid is null then raise exception 'Please sign in to place an order' using errcode = '28000'; end if;
  if (select status from public.profiles where id = v_uid) is distinct from 'active' then raise exception 'Your account cannot place orders'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your bag is empty'; end if;
  if jsonb_array_length(p_items) > 40 then raise exception 'Too many items'; end if;
  if coalesce(p_address ->> 'name', '') = '' or coalesce(p_address ->> 'line1', '') = '' or coalesce(p_address ->> 'city', '') = ''
     or coalesce(p_address ->> 'state', '') = '' or coalesce(p_address ->> 'pincode', '') !~ '^[1-9][0-9]{5}$'
     or coalesce(p_address ->> 'phone', '') = '' then
    raise exception 'Please provide a complete delivery address';
  end if;

  select value into v_ship from public.settings where key = 'shipping';
  v_free := coalesce((v_ship ->> 'freeAbove')::int, 1499);   v_std := coalesce((v_ship ->> 'standardFee')::int, 99);
  v_exp  := coalesce((v_ship ->> 'expressFee')::int, 149);   v_cod := coalesce((v_ship ->> 'codFee')::int, 40);

  -- the order row first (totals fixed up below); every line then decrements stock atomically
  insert into public.orders (user_id, subtotal, total, payment_method, address)
  values (v_uid, 0, 0, p_payment_method, p_address) returning id, number into v_order, v_num;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then raise exception 'Invalid quantity'; end if;

    select p.id, p.name, p.price, p.seller_id, p.status, p.photo_kind into v_p
      from public.products p where p.id = (v_item ->> 'product_id')::uuid;
    if not found or v_p.status <> 'active' then raise exception 'An item in your bag is no longer available'; end if;

    -- atomic stock decrement: fails (and rolls everything back) if there isn't enough
    update public.product_options set stock = stock - v_qty
      where product_id = v_p.id and value = v_item ->> 'option_value' and stock >= v_qty;
    if not found then raise exception 'Not enough stock for %', v_p.name; end if;

    v_color := nullif(v_item ->> 'color', '');
    select url into v_img from public.product_images where product_id = v_p.id order by is_cover desc, sort limit 1;
    insert into public.order_items (order_id, product_id, seller_id, name, color, option_value, qty, price, photo_kind, image_url)
    values (v_order, v_p.id, v_p.seller_id, v_p.name, v_color, v_item ->> 'option_value', v_qty, v_p.price, v_p.photo_kind, v_img);

    v_subtotal := v_subtotal + v_p.price * v_qty;
    if not (v_p.seller_id = any (v_sellers)) then v_sellers := v_sellers || v_p.seller_id; end if;
  end loop;

  -- coupon (re-validated here; the client's calculation is display only)
  if p_coupon is not null and btrim(p_coupon) <> '' then
    select * into v_cp from public.coupons
      where upper(code) = upper(btrim(p_coupon)) and status = 'active' and seller_id is null
        and (expires_at is null or expires_at >= current_date) and used_count < usage_limit
      for update;
    if not found then raise exception 'That coupon is not valid'; end if;
    if v_subtotal < v_cp.min_order then raise exception 'Add ₹% more to use %', v_cp.min_order - v_subtotal, v_cp.code; end if;
    if upper(v_cp.code) = 'WELCOME10' and exists (
        select 1 from public.orders o where o.user_id = v_uid and o.id <> v_order and o.status <> 'cancelled') then
      raise exception 'WELCOME10 is only for your first order';
    end if;
    if v_cp.type = 'percent' then v_discount := least(coalesce(v_cp.max_discount, 2147483647), round(v_subtotal * v_cp.value / 100.0)::int);
    elsif v_cp.type = 'flat' then v_discount := least(v_cp.value, v_subtotal);
    else v_free_ship := true; end if;
    update public.coupons set used_count = used_count + 1 where id = v_cp.id;
  end if;

  v_shipping := case when v_free_ship or (v_subtotal - v_discount) >= v_free then 0 else v_std end;
  v_expfee := case when p_express then v_exp else 0 end;
  v_codfee := case when p_payment_method = 'cod' then v_cod else 0 end;
  v_total := v_subtotal - v_discount + v_shipping + v_expfee + v_codfee;

  update public.orders set subtotal = v_subtotal, discount = v_discount, shipping_fee = v_shipping, express_fee = v_expfee,
         cod_fee = v_codfee, total = v_total, coupon_code = upper(nullif(btrim(coalesce(p_coupon, '')), ''))
   where id = v_order;
  insert into public.order_events (order_id, status, note) values (v_order, 'placed', 'Order placed successfully');

  perform public.notify(null, 'admin', 'order', 'New order ' || v_num, 'Order worth ₹' || v_total || ' was placed.');
  foreach v_owner in array (select coalesce(array_agg(owner_id), '{}') from public.sellers where id = any (v_sellers) and owner_id is not null) loop
    perform public.notify(v_owner, 'seller', 'order', 'New order ' || v_num, 'You have a new order to confirm.');
  end loop;

  return query select v_order, v_num, v_total;
end $$;

-- called by the payment webhook / server only
create or replace function public.confirm_payment(p_order uuid, p_ref text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_service() then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.orders set payment_status = 'paid', payment_ref = p_ref where id = p_order and payment_status <> 'paid';
  insert into public.order_events (order_id, status, note) select id, status, 'Payment received' from public.orders where id = p_order;
end $$;

-- ---- CANCEL ORDER (customer: own, before packing · admin: any before shipping) ----
create or replace function public.cancel_order(p_order uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_o record; v_admin boolean := public.is_admin();
begin
  select * into v_o from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  if not v_admin and v_o.user_id is distinct from auth.uid() then raise exception 'Order not found'; end if;
  if v_o.status not in ('placed', 'confirmed') and not (v_admin and v_o.status = 'packed') then
    raise exception 'This order can no longer be cancelled';
  end if;

  update public.product_options po set stock = po.stock + oi.qty
    from public.order_items oi
   where oi.order_id = p_order and po.product_id = oi.product_id and po.value = oi.option_value;

  update public.orders set status = 'cancelled',
         payment_status = case when payment_status = 'paid' then 'refunded' else payment_status end
   where id = p_order;
  insert into public.order_events (order_id, status, note)
  values (p_order, 'cancelled', coalesce(nullif(btrim(p_reason), ''), 'Cancelled') || case when v_o.payment_status = 'paid' then ' — refund initiated' else '' end);
  perform public.notify(null, 'admin', 'order', 'Order ' || v_o.number || ' cancelled', coalesce(p_reason, 'No reason given'));
end $$;

-- ---- ORDER STATUS (admin: any forward step · seller: confirm → shipped on orders containing their items) ----
create or replace function public.set_order_status(p_order uuid, p_status public.order_status, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_o record; v_admin boolean := public.is_admin(); v_is_seller boolean;
begin
  select * into v_o from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;

  v_is_seller := exists (select 1 from public.order_items oi where oi.order_id = p_order and public.owns_seller(oi.seller_id));
  if not v_admin and not v_is_seller then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_status in ('cancelled', 'returned') then raise exception 'Use the cancel / return flow'; end if;
  if public.order_rank(p_status) <= public.order_rank(v_o.status) then raise exception 'Cannot move an order backwards'; end if;
  if not v_admin and (p_status not in ('confirmed', 'packed', 'shipped') or public.order_rank(p_status) <> public.order_rank(v_o.status) + 1) then
    raise exception 'Sellers can move an order one step at a time up to Shipped';
  end if;
  if v_o.status in ('cancelled', 'returned', 'delivered') then raise exception 'This order is closed'; end if;

  update public.orders set status = p_status,
         awb = case when p_status = 'shipped' and awb is null then (1000000000 + floor(random() * 8999999999))::bigint::text else awb end,
         courier = case when p_status = 'shipped' and courier is null then 'Delhivery' else courier end,
         payment_status = case when p_status = 'delivered' and payment_method = 'cod' then 'paid' else payment_status end
   where id = p_order;
  insert into public.order_events (order_id, status, note)
  values (p_order, p_status, coalesce(nullif(btrim(p_note), ''), 'Updated to ' || replace(p_status::text, '_', ' ')));
  perform public.notify(v_o.user_id, 'user', 'order', 'Order ' || v_o.number || ': ' || replace(p_status::text, '_', ' '), 'Your order status was updated.');
end $$;

-- ---- RETURNS ------------------------------------------------------------------
create or replace function public.request_return(p_order uuid, p_item uuid, p_type public.return_type, p_reason text, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_o record; v_i record; v_delivered timestamptz; v_id uuid; v_owner uuid;
begin
  select * into v_o from public.orders where id = p_order;
  if not found or v_o.user_id is distinct from auth.uid() then raise exception 'Order not found'; end if;
  if v_o.status <> 'delivered' then raise exception 'Only delivered orders can be returned'; end if;
  select max(created_at) into v_delivered from public.order_events where order_id = p_order and status = 'delivered';
  if v_delivered is null or v_delivered < now() - interval '7 days' then raise exception 'The 7-day return window has closed'; end if;
  select * into v_i from public.order_items where id = p_item and order_id = p_order;
  if not found then raise exception 'Item not found'; end if;
  if exists (select 1 from public.returns where order_item_id = p_item and status not in ('rejected')) then raise exception 'A return is already open for this item'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'Please choose a reason'; end if;

  insert into public.returns (order_id, order_item_id, seller_id, user_id, type, reason, note, amount)
  values (p_order, p_item, v_i.seller_id, auth.uid(), p_type, p_reason, p_note, v_i.price * v_i.qty) returning id into v_id;
  select owner_id into v_owner from public.sellers where id = v_i.seller_id;
  if v_owner is not null then perform public.notify(v_owner, 'seller', 'order', 'Return requested', v_o.number || ' · ' || v_i.name); end if;
  perform public.notify(null, 'admin', 'order', 'Return requested', v_o.number || ' · ' || v_i.name);
  return v_id;
end $$;

create or replace function public.decide_return(p_return uuid, p_status public.return_status) returns void
language plpgsql security definer set search_path = public as $$
declare v_r record; v_admin boolean := public.is_admin(); v_seller boolean;
begin
  select * into v_r from public.returns where id = p_return for update;
  if not found then raise exception 'Return not found'; end if;
  v_seller := public.owns_seller(v_r.seller_id);
  if not v_admin and not v_seller then raise exception 'Not allowed' using errcode = '42501'; end if;

  if not (
       (v_r.status = 'requested' and p_status in ('approved', 'rejected'))
    or (v_r.status = 'approved'  and p_status = 'picked_up')
    or (v_r.status = 'picked_up' and p_status = 'refunded' and v_admin)
  ) then raise exception 'That change is not allowed from %', v_r.status; end if;

  update public.returns set status = p_status where id = p_return;
  if p_status = 'refunded' then
    update public.orders set payment_status = 'refunded',
           status = case when (select count(*) from public.order_items where order_id = v_r.order_id) = 1 then 'returned' else status end
     where id = v_r.order_id;
    insert into public.order_events (order_id, status, note)
    select v_r.order_id, status, 'Refund of ₹' || v_r.amount || ' issued' from public.orders where id = v_r.order_id;
  end if;
  perform public.notify(v_r.user_id, 'user', 'order', 'Return ' || replace(p_status::text, '_', ' '), 'Your return request was updated.');
end $$;

-- ---- PAYOUTS (admin) -------------------------------------------------------------
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
      and not exists (select 1 from public.returns r where r.order_item_id = oi.id and r.status = 'refunded')
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

-- ---- DASHBOARDS (one round trip each) ----------------------------------------------
create or replace function public.admin_dashboard() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select jsonb_build_object(
    'revenue30', coalesce(sum(total) filter (where created_at >= now() - interval '30 days' and status not in ('cancelled')), 0),
    'orders30',  count(*) filter (where created_at >= now() - interval '30 days' and status not in ('cancelled')),
    'aov',       coalesce(round(avg(total) filter (where status not in ('cancelled')))::int, 0),
    'pendingOrders', count(*) filter (where status in ('placed', 'confirmed'))
  ) into r from public.orders;
  r := r || jsonb_build_object(
    'pendingSellers', (select count(*) from public.sellers where status = 'pending'),
    'openReturns',    (select count(*) from public.returns where status = 'requested'),
    'flaggedReviews', (select count(*) from public.reviews where status <> 'published'),
    'statusCounts', coalesce((select jsonb_agg(jsonb_build_object('status', status, 'count', c)) from (select status, count(*) c from public.orders group by status) s), '[]'),
    'daily', (select jsonb_agg(jsonb_build_object('day', to_char(d, 'DD Mon'), 'revenue', coalesce(x.rev, 0), 'orders', coalesce(x.n, 0)) order by d)
              from generate_series(current_date - 29, current_date, interval '1 day') d
              left join (select created_at::date dd, sum(total) rev, count(*) n from public.orders where status <> 'cancelled' group by 1) x on x.dd = d::date),
    'topProducts', coalesce((select jsonb_agg(t) from (
        select oi.name as label, sum(oi.price * oi.qty)::int as value, sum(oi.qty) || ' sold' as sub
        from public.order_items oi join public.orders o on o.id = oi.order_id where o.status <> 'cancelled'
        group by oi.name order by 2 desc limit 5) t), '[]'),
    'topSellers', coalesce((select jsonb_agg(t) from (
        select s.name as label, sum(oi.price * oi.qty)::int as value, s.city as sub
        from public.order_items oi join public.orders o on o.id = oi.order_id join public.sellers s on s.id = oi.seller_id
        where o.status <> 'cancelled' group by s.name, s.city order by 2 desc limit 5) t), '[]'),
    'lowStock', coalesce((select jsonb_agg(t) from (
        select p.id, p.name, coalesce(sum(po.stock), 0)::int as units
        from public.products p left join public.product_options po on po.product_id = p.id
        where p.status <> 'draft' group by p.id having coalesce(sum(po.stock), 0) <= 12 order by 3 limit 5) t), '[]')
  );
  return r;
end $$;

create or replace function public.seller_dashboard(p_seller uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not (public.owns_seller(p_seller) or public.is_admin()) then raise exception 'Not allowed' using errcode = '42501'; end if;
  select jsonb_build_object(
    'toConfirm', count(distinct o.id) filter (where o.status = 'placed'),
    'toPack',    count(distinct o.id) filter (where o.status = 'confirmed'),
    'toShip',    count(distinct o.id) filter (where o.status = 'packed'),
    'todaySales', coalesce(sum(oi.price * oi.qty) filter (where o.created_at >= now() - interval '2 days' and o.status <> 'cancelled'), 0),
    'weekSales',  coalesce(sum(oi.price * oi.qty) filter (where o.created_at >= now() - interval '7 days' and o.status <> 'cancelled'), 0),
    'monthSales', coalesce(sum(oi.price * oi.qty) filter (where o.created_at >= now() - interval '30 days' and o.status <> 'cancelled'), 0)
  ) into r
  from public.order_items oi join public.orders o on o.id = oi.order_id where oi.seller_id = p_seller;
  r := r || jsonb_build_object(
    'returnsOpen', (select count(*) from public.returns where seller_id = p_seller and status = 'requested'),
    'pendingPayout', coalesce((select sum(net) from public.payouts where seller_id = p_seller and status in ('scheduled', 'processing')), 0),
    'weekly', coalesce((select jsonb_agg(jsonb_build_object('week', to_char(w, 'DD Mon'), 'sales', coalesce(x.s, 0)) order by w)
              from generate_series(date_trunc('week', current_date) - interval '6 weeks', date_trunc('week', current_date), interval '1 week') w
              left join (select date_trunc('week', o.created_at) wk, sum(oi.price * oi.qty) s from public.order_items oi
                         join public.orders o on o.id = oi.order_id where oi.seller_id = p_seller and o.status <> 'cancelled' group by 1) x on x.wk = w), '[]')
  );
  return r;
end $$;

-- who may call what
revoke all on function public.place_order(jsonb, jsonb, public.payment_method, text, boolean) from public, anon;
revoke all on function public.confirm_payment(uuid, text) from public, anon, authenticated;
revoke all on function public.cancel_order(uuid, text) from public, anon;
revoke all on function public.set_order_status(uuid, public.order_status, text) from public, anon;
revoke all on function public.request_return(uuid, uuid, public.return_type, text, text) from public, anon;
revoke all on function public.decide_return(uuid, public.return_status) from public, anon;
revoke all on function public.generate_payouts(date, date) from public, anon;
revoke all on function public.admin_dashboard() from public, anon;
revoke all on function public.seller_dashboard(uuid) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, public.payment_method, text, boolean) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;
grant execute on function public.set_order_status(uuid, public.order_status, text) to authenticated;
grant execute on function public.request_return(uuid, uuid, public.return_type, text, text) to authenticated;
grant execute on function public.decide_return(uuid, public.return_status) to authenticated;
grant execute on function public.generate_payouts(date, date) to authenticated;
grant execute on function public.admin_dashboard() to authenticated;
grant execute on function public.seller_dashboard(uuid) to authenticated;
grant execute on function public.confirm_payment(uuid, text) to service_role;

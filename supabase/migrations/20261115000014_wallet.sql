-- =============================================================================
-- 0014 · WALLET
--  · every new CUSTOMER gets a ₹500 welcome credit the moment their account is created
--  · the wallet balance can be used at checkout (place_order_wallet) — it lowers the order total
--  · cancelling an order gives back what was used (wallet_refund_order)
-- The balance is never stored: it is the sum of the ledger (wallet_transactions), so it can't drift.
-- Safe to run more than once.
-- =============================================================================

alter table public.orders add column if not exists wallet_used int not null default 0 check (wallet_used >= 0);

create table if not exists public.wallet_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  amount     int  not null check (amount <> 0),                      -- + credit, − spent
  kind       text not null check (kind in ('welcome', 'order', 'refund', 'adjust')),
  order_id   uuid references public.orders (id) on delete set null,
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists wallet_tx_user on public.wallet_transactions (user_id, created_at desc);
create unique index if not exists wallet_one_welcome on public.wallet_transactions (user_id) where kind = 'welcome';
create unique index if not exists wallet_one_refund  on public.wallet_transactions (order_id) where kind = 'refund';

alter table public.wallet_transactions enable row level security;
drop policy if exists wallet_own_read on public.wallet_transactions;
create policy wallet_own_read on public.wallet_transactions for select using (user_id = auth.uid());
drop policy if exists wallet_admin_read on public.wallet_transactions;
create policy wallet_admin_read on public.wallet_transactions for select using (public.is_admin());
-- no insert/update/delete policies: rows are written only by the functions below and by the server (service role)

-- ---- welcome credit: ₹500 for every new customer (keep the number in step with WELCOME_CREDIT in src/lib/wallet.ts)
create or replace function public.grant_welcome_credit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'customer' then
    insert into public.wallet_transactions (user_id, amount, kind, note) values (new.id, 500, 'welcome', 'Welcome gift')
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists profiles_welcome_credit on public.profiles;
create trigger profiles_welcome_credit after insert on public.profiles
  for each row execute function public.grant_welcome_credit();

-- Backfill existing customers who registered before this migration ran:
insert into public.wallet_transactions (user_id, amount, kind, note)
select id, 500, 'welcome', 'Welcome gift'
from public.profiles
where role = 'customer'
on conflict do nothing;

-- ---- place an order and pay part (or all) of it from the wallet, in ONE transaction
create or replace function public.place_order_wallet(
  p_items jsonb, p_address jsonb, p_payment_method public.payment_method,
  p_coupon text default null, p_express boolean default false, p_wallet int default 0
) returns table (order_id uuid, order_number text, total int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare r record; v_uid uuid := auth.uid(); v_bal int; v_use int; v_total int;
begin
  select * into r from public.place_order(p_items, p_address, p_payment_method, p_coupon, p_express);
  v_total := r.total;
  if coalesce(p_wallet, 0) > 0 and v_uid is not null then
    perform pg_advisory_xact_lock(hashtext('wallet:' || v_uid::text));     -- two checkouts at once can't spend the same money
    select coalesce(sum(amount), 0)::int into v_bal from public.wallet_transactions where user_id = v_uid;
    v_use := least(p_wallet, v_bal, v_total);
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

-- ---- cancelled order → the wallet money comes back (once)
create or replace function public.wallet_refund_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v record;
begin
  if not (public.is_service() or public.is_admin()) then raise exception 'Not allowed' using errcode = '42501'; end if;
  select id, user_id, number, wallet_used into v from public.orders where id = p_order;
  if not found or v.wallet_used <= 0 then return; end if;
  insert into public.wallet_transactions (user_id, amount, kind, order_id, note)
  values (v.user_id, v.wallet_used, 'refund', v.id, 'Refund for cancelled order ' || v.number)
  on conflict do nothing;
end $$;

revoke all on function public.place_order_wallet(jsonb, jsonb, public.payment_method, text, boolean, int) from public, anon;
grant execute on function public.place_order_wallet(jsonb, jsonb, public.payment_method, text, boolean, int) to authenticated;
revoke all on function public.wallet_refund_order(uuid) from public, anon, authenticated;
grant execute on function public.wallet_refund_order(uuid) to service_role;   -- the server calls it when an order is cancelled

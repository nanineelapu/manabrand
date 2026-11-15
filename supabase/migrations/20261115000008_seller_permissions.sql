-- Per-seller access, set by the admin.
--   add_products     seller can create / edit their own products
--   publish_directly products go live immediately (otherwise they wait for admin review)
--   manage_inventory seller can change stock levels
--   run_promotions   seller can create discounts / promotions
--   view_earnings    seller can see earnings & payouts
-- Only an admin (or the server) can change these; a seller can never edit their own.

alter table public.sellers
  add column if not exists permissions jsonb not null
  default '{"add_products":true,"publish_directly":false,"manage_inventory":true,"run_promotions":true,"view_earnings":true}'::jsonb;

create or replace function public.seller_can(p_seller uuid, p_perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (permissions ->> p_perm)::boolean from public.sellers where id = p_seller and status = 'active'), false)
$$;

create or replace function public.protect_seller_columns() returns trigger
language plpgsql as $$
begin
  if public.is_service() or public.is_admin() then return new; end if;
  if new.status is distinct from old.status or new.kyc is distinct from old.kyc
     or new.commission_pct is distinct from old.commission_pct or new.owner_id is distinct from old.owner_id
     or new.permissions is distinct from old.permissions then
    raise exception 'Not allowed to change protected seller fields' using errcode = '42501';
  end if;
  return new;
end $$;

-- products: a seller needs the "add_products" permission; "active" status needs "publish_directly"
drop policy if exists products_seller_insert on public.products;
drop policy if exists products_seller_update on public.products;
create policy products_seller_insert on public.products for insert
  with check (public.owns_active_seller(seller_id) and public.seller_can(seller_id, 'add_products')
    and (status in ('draft', 'pending_review') or (status = 'active' and public.seller_can(seller_id, 'publish_directly'))));
create policy products_seller_update on public.products for update
  using (public.owns_active_seller(seller_id) and public.seller_can(seller_id, 'add_products'))
  with check (public.owns_active_seller(seller_id) and public.seller_can(seller_id, 'add_products')
    and (status in ('draft', 'pending_review', 'out_of_stock') or (status = 'active' and public.seller_can(seller_id, 'publish_directly'))));

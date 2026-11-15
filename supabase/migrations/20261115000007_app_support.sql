-- =============================================================================
-- 0007 · APP SUPPORT  (follows, review author snapshot, seller order access)
-- =============================================================================

-- shoppers follow sellers (follower counts are derived, never typed in)
create table public.seller_follows (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  seller_id  uuid not null references public.sellers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, seller_id)
);
alter table public.seller_follows enable row level security;
create policy follows_own   on public.seller_follows for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy follows_count on public.seller_follows for select using (true);   -- counts are public; rows carry no personal data

-- public review cards need a name + city, but other users' profiles are private → snapshot at write time
alter table public.reviews add column author_name text, add column author_city text;

-- order items remember the colour swatch they were bought in
alter table public.order_items add column color_hex text;

-- sellers can follow the timeline of orders that contain their items
create policy order_events_seller on public.order_events for select
  using (exists (select 1 from public.order_items oi where oi.order_id = order_events.order_id and public.owns_seller(oi.seller_id)));

-- richer seller view (payment METHOD/STATUS only — never other sellers' lines or the order total)
drop view public.seller_orders;
create view public.seller_orders as
  select o.id as order_id, o.number, o.status, o.created_at, o.awb, o.courier, o.address,
         o.payment_method, o.payment_status,
         oi.id as item_id, oi.product_id, oi.name, oi.color, oi.color_hex, oi.option_value, oi.qty, oi.price,
         oi.seller_id, oi.photo_kind, oi.image_url,
         p.full_name as customer_name, o.user_id
  from public.order_items oi
  join public.orders o   on o.id = oi.order_id
  join public.profiles p on p.id = o.user_id
  where public.owns_seller(oi.seller_id) or public.is_admin();
grant select on public.seller_orders to authenticated;

-- place_order: also remember the colour hex (kept here so the migration history stays linear)
create or replace function public.order_item_color_hex(p_product uuid, p_color text) returns text
language sql stable security definer set search_path = public as $$
  select hex from public.product_colors where product_id = p_product and name = p_color limit 1
$$;
revoke all on function public.order_item_color_hex(uuid, text) from public, anon, authenticated;

create or replace function public.stamp_order_item_color() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.color_hex is null and new.color is not null then
    new.color_hex := public.order_item_color_hex(new.product_id, new.color);
  end if;
  return new;
end $$;
create trigger order_items_color before insert on public.order_items
  for each row execute function public.stamp_order_item_color();

-- an admin can invite/read team + customers list efficiently
create index if not exists profiles_role on public.profiles (role);
create index if not exists reviews_product_status on public.reviews (product_id, status);

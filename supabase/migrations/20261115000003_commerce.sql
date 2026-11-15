-- =============================================================================
-- 0003 · COMMERCE  (addresses, cart, wishlist, coupons, orders, returns, reviews)
-- Orders, payments, stock and refunds are written ONLY by the server (service
-- role). There is intentionally no INSERT policy on orders/order_items so a
-- browser can never submit its own prices.
-- =============================================================================

create type public.order_status   as enum ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned');
create type public.payment_method as enum ('upi','card','cod','netbanking','wallet');
create type public.payment_status as enum ('paid','pending','refunded','failed');
create type public.return_type    as enum ('return','exchange','refund');
create type public.return_status  as enum ('requested','approved','picked_up','refunded','rejected');
create type public.coupon_type    as enum ('percent','flat','shipping');
create type public.coupon_status  as enum ('active','scheduled','expired','paused');
create type public.review_status  as enum ('published','pending','flagged');

-- ---- addresses --------------------------------------------------------------
create table public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  label      text not null default 'Home' check (label in ('Home','Work','Other')),
  name       text not null,
  phone      text not null,
  line1      text not null,
  line2      text,
  city       text not null,
  state      text not null,
  pincode    text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index addresses_one_default on public.addresses (user_id) where is_default;

-- ---- cart & wishlist (synced after login) -----------------------------------
create table public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles (id) on delete cascade,
  coupon     text,
  updated_at timestamptz not null default now()
);
create table public.cart_items (
  id           uuid primary key default gen_random_uuid(),
  cart_id      uuid not null references public.carts (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete cascade,
  color        text,
  option_value text not null,
  qty          int  not null check (qty between 1 and 10),
  unique (cart_id, product_id, color, option_value)
);
create table public.wishlists (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---- coupons ----------------------------------------------------------------
create table public.coupons (
  id           uuid primary key default gen_random_uuid(),
  code         text not null,
  description  text not null default '',
  type         public.coupon_type not null,
  value        int  not null default 0 check (value >= 0),
  min_order    int  not null default 0,
  max_discount int,
  usage_limit  int  not null default 1000,
  used_count   int  not null default 0,
  expires_at   date,
  status       public.coupon_status not null default 'active',
  seller_id    uuid references public.sellers (id) on delete cascade,
  created_at   timestamptz not null default now()
);
create unique index coupons_code_key on public.coupons (upper(code));

-- ---- orders -----------------------------------------------------------------
create sequence public.order_number_seq start 10500;

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique default ('MB-' || nextval('public.order_number_seq')),
  user_id        uuid not null references public.profiles (id) on delete restrict,
  status         public.order_status not null default 'placed',
  subtotal       int not null,
  discount       int not null default 0,
  shipping_fee   int not null default 0,
  cod_fee        int not null default 0,
  express_fee    int not null default 0,
  total          int not null,
  coupon_code    text,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  payment_ref    text,                                -- gateway payment id
  address        jsonb not null,                      -- snapshot at purchase time
  awb            text,
  courier        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index orders_user on public.orders (user_id, created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete restrict,
  seller_id    uuid not null references public.sellers (id) on delete restrict,
  name         text not null,                         -- snapshots: prices/names may change later
  color        text,
  option_value text not null,
  qty          int  not null check (qty > 0),
  price        int  not null check (price >= 0),
  photo_kind   text not null default 'decor'
);
create index order_items_order  on public.order_items (order_id);
create index order_items_seller on public.order_items (seller_id);

create table public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     public.order_status not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index order_events_order on public.order_events (order_id, created_at);

create table public.order_notes (                      -- internal staff notes
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  author_id  uuid references public.profiles (id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

create table public.returns (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid references public.order_items (id) on delete set null,
  seller_id     uuid not null references public.sellers (id),
  user_id       uuid not null references public.profiles (id),
  type          public.return_type not null default 'return',
  reason        text not null,
  note          text,
  status        public.return_status not null default 'requested',
  amount        int not null default 0,
  created_at    timestamptz not null default now()
);
create index returns_seller on public.returns (seller_id, status);

-- ---- reviews ----------------------------------------------------------------
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  order_id     uuid references public.orders (id) on delete set null,
  rating       int  not null check (rating between 1 and 5),
  title        text not null default '',
  body         text not null default '',
  status       public.review_status not null default 'pending',
  verified     boolean not null default false,
  helpful      int not null default 0,
  seller_reply text,
  created_at   timestamptz not null default now(),
  unique (product_id, user_id)
);

-- keep product rating/review counters correct automatically
create or replace function public.refresh_product_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating_avg   = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where product_id = v_pid and status = 'published'), 0),
    review_count = (select count(*) from public.reviews where product_id = v_pid and status = 'published')
  where p.id = v_pid;
  return null;
end $$;
create trigger reviews_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- count sales when an order is delivered
create or replace function public.count_sales() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    update public.products p set sold_count = p.sold_count + oi.qty
    from public.order_items oi where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end $$;
create trigger orders_count_sales after update of status on public.orders
  for each row execute function public.count_sales();

-- ---- a seller sees ONLY their own lines of an order, never other sellers' money
create view public.seller_orders as
  select o.id as order_id, o.number, o.status, o.created_at, o.awb, o.courier,
         o.address, oi.id as item_id, oi.product_id, oi.name, oi.color, oi.option_value,
         oi.qty, oi.price, oi.seller_id, oi.photo_kind,
         p.full_name as customer_name
  from public.order_items oi
  join public.orders o   on o.id = oi.order_id
  join public.profiles p on p.id = o.user_id
  where public.owns_seller(oi.seller_id) or public.is_admin();
grant select on public.seller_orders to authenticated;

-- ---- row-level security -----------------------------------------------------
alter table public.addresses    enable row level security;
alter table public.carts        enable row level security;
alter table public.cart_items   enable row level security;
alter table public.wishlists    enable row level security;
alter table public.coupons      enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.order_events enable row level security;
alter table public.order_notes  enable row level security;
alter table public.returns      enable row level security;
alter table public.reviews      enable row level security;

create policy addresses_own on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy carts_own     on public.carts     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cart_items_own on public.cart_items for all
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy wishlists_own on public.wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy coupons_read_active on public.coupons for select using (status = 'active' and (expires_at is null or expires_at >= current_date));
create policy coupons_admin       on public.coupons for all using (public.is_admin()) with check (public.is_admin());

-- orders: read-only for the owner and admins. Writes = service role.
create policy orders_read_own   on public.orders for select using (user_id = auth.uid());
create policy orders_read_admin on public.orders for select using (public.is_admin());
create policy orders_admin_upd  on public.orders for update using (public.is_admin());
create policy order_items_own   on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy order_items_admin on public.order_items for select using (public.is_admin());
create policy order_events_own  on public.order_events for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy order_events_admin on public.order_events for all using (public.is_admin()) with check (public.is_admin());
create policy order_notes_admin on public.order_notes for all using (public.is_admin()) with check (public.is_admin());

create policy returns_own    on public.returns for select using (user_id = auth.uid());
create policy returns_seller on public.returns for select using (public.owns_seller(seller_id));
create policy returns_admin  on public.returns for all using (public.is_admin()) with check (public.is_admin());

-- reviews: published are public; a buyer may submit ONE review (pending) for a product they received
create policy reviews_read_published on public.reviews for select using (status = 'published');
create policy reviews_read_own       on public.reviews for select using (user_id = auth.uid());
create policy reviews_read_seller    on public.reviews for select
  using (exists (select 1 from public.products p where p.id = product_id and public.owns_seller(p.seller_id)));
create policy reviews_insert_buyer   on public.reviews for insert
  with check (
    user_id = auth.uid() and status = 'pending' and verified = true
    and exists (
      select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
      where o.user_id = auth.uid() and oi.product_id = reviews.product_id and o.status = 'delivered'
    )
  );
create policy reviews_admin on public.reviews for all using (public.is_admin()) with check (public.is_admin());

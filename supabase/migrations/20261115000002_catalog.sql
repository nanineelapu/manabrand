-- =============================================================================
-- 0002 · CATALOGUE  (categories, sellers, products, variants, collections)
-- =============================================================================

create type public.seller_status  as enum ('active', 'pending', 'suspended', 'rejected');
create type public.kyc_status     as enum ('verified', 'pending', 'rejected');
create type public.product_status as enum ('active', 'draft', 'out_of_stock', 'pending_review');

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  tagline    text not null default '',
  photo_kind text not null default 'decor',
  sort       int  not null default 0
);

create table public.subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name        text not null,
  sort        int  not null default 0,
  unique (category_id, name)
);

create table public.sellers (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid unique references public.profiles (id) on delete set null,
  slug            text not null unique,
  name            text not null,
  owner_name      text not null,
  email           text not null,
  phone           text,
  city            text,
  state           text,
  status          public.seller_status not null default 'pending',
  kyc             public.kyc_status    not null default 'pending',
  gstin           text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9]Z[0-9A-Z]$'),
  pan             text check (pan   is null or pan   ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  bank_ifsc       text check (bank_ifsc is null or bank_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  bank_account_last4 text,                   -- full number lives encrypted/in a vault, never in the clear
  commission_pct  numeric(4,2) not null default 12 check (commission_pct between 0 and 40),
  blurb           text not null default '',
  logo_url        text,
  banner_url      text,
  pickup_address  text,
  holiday_mode    boolean not null default false,
  tone_from       text not null default '#e9c46f',
  tone_to         text not null default '#0e7a5f',
  joined_at       timestamptz not null default now()
);

create table public.seller_documents (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references public.sellers (id) on delete cascade,
  doc_type   text not null check (doc_type in ('pan', 'gst', 'cancelled_cheque', 'address_proof')),
  file_path  text not null,                    -- path in the private `seller-kyc` bucket
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  seller_id      uuid not null references public.sellers (id) on delete restrict,
  category_id    uuid not null references public.categories (id),
  subcategory_id uuid references public.subcategories (id),
  name           text not null check (char_length(name) between 3 and 140),
  description    text not null default '',
  price          int  not null check (price > 0),             -- integer rupees
  mrp            int  not null check (mrp >= price),
  option_label   text not null default 'Standard',           -- Size | Storage | Volume | Pack | Config | Standard
  material       text not null default '',
  care           text[] not null default '{}',
  details        text[] not null default '{}',
  tags           text[] not null default '{}',
  badges         text[] not null default '{}',
  photo_kind     text not null default 'decor',              -- fallback photo set until real images exist
  status         public.product_status not null default 'draft',
  rating_avg     numeric(2,1) not null default 0,
  review_count   int not null default 0,
  sold_count     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index products_category_status on public.products (category_id, status);
create index products_seller          on public.products (seller_id);
create index products_name_fts        on public.products using gin (to_tsvector('simple', name));
create index products_tags            on public.products using gin (tags);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_colors (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name       text not null,
  hex        text not null check (hex ~ '^#[0-9a-fA-F]{6}$'),
  sort       int  not null default 0,
  unique (product_id, name)
);

-- One row per size / storage / volume / pack — THIS is the inventory.
create table public.product_options (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  value      text not null,
  stock      int  not null default 0 check (stock >= 0),
  sort       int  not null default 0,
  unique (product_id, value)
);

create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id   uuid references public.product_colors (id) on delete set null,
  url        text not null,
  sort       int  not null default 0,
  is_cover   boolean not null default false
);
create index product_images_product on public.product_images (product_id, sort);

create table public.collections (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  story      text not null default '',
  photo_kind text not null default 'decor',
  sort       int  not null default 0
);
create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  sort          int not null default 0,
  primary key (collection_id, product_id)
);

-- ---- helpers for policies ---------------------------------------------------
create or replace function public.owns_seller(p_seller uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sellers where id = p_seller and owner_id = auth.uid())
$$;
create or replace function public.owns_active_seller(p_seller uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sellers where id = p_seller and owner_id = auth.uid() and status = 'active')
$$;
create or replace function public.product_visible(p_product uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.products p
    where p.id = p_product
      and (p.status = 'active' or public.is_admin() or public.owns_seller(p.seller_id))
  )
$$;

-- ---- row-level security -----------------------------------------------------
alter table public.categories          enable row level security;
alter table public.subcategories       enable row level security;
alter table public.sellers             enable row level security;
alter table public.seller_documents    enable row level security;
alter table public.products            enable row level security;
alter table public.product_colors      enable row level security;
alter table public.product_options     enable row level security;
alter table public.product_images      enable row level security;
alter table public.collections         enable row level security;
alter table public.collection_products enable row level security;

-- public reads
create policy categories_read    on public.categories          for select using (true);
create policy subcategories_read on public.subcategories       for select using (true);
create policy collections_read   on public.collections         for select using (true);
create policy collprod_read      on public.collection_products for select using (true);

create policy sellers_read_active on public.sellers for select using (status = 'active');
create policy sellers_read_own    on public.sellers for select using (owner_id = auth.uid());
create policy sellers_read_admin  on public.sellers for select using (public.is_admin());
-- a seller edits their own storefront but cannot approve themselves or change fees
create policy sellers_update_own  on public.sellers for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy sellers_admin_all   on public.sellers for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.protect_seller_columns() returns trigger
language plpgsql as $$
begin
  if public.is_service() or public.is_admin() then return new; end if;
  if new.status is distinct from old.status or new.kyc is distinct from old.kyc
     or new.commission_pct is distinct from old.commission_pct or new.owner_id is distinct from old.owner_id then
    raise exception 'Not allowed to change protected seller fields' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger sellers_protect before update on public.sellers
  for each row execute function public.protect_seller_columns();

create policy seller_docs_own   on public.seller_documents for select using (public.owns_seller(seller_id));
create policy seller_docs_admin on public.seller_documents for all using (public.is_admin()) with check (public.is_admin());

-- products: public sees active; seller sees/edits own; admin everything
create policy products_read on public.products for select
  using (status = 'active' or public.is_admin() or public.owns_seller(seller_id));
create policy products_seller_insert on public.products for insert
  with check (public.owns_active_seller(seller_id) and status in ('draft', 'pending_review'));
create policy products_seller_update on public.products for update
  using (public.owns_active_seller(seller_id))
  with check (public.owns_active_seller(seller_id) and status in ('draft', 'pending_review', 'out_of_stock'));
create policy products_admin_all on public.products for all using (public.is_admin()) with check (public.is_admin());

-- child rows follow their product
create policy colors_read  on public.product_colors  for select using (public.product_visible(product_id));
create policy options_read on public.product_options for select using (public.product_visible(product_id));
create policy images_read  on public.product_images  for select using (public.product_visible(product_id));
create policy colors_write on public.product_colors  for all
  using (public.is_admin() or exists (select 1 from public.products p where p.id = product_id and public.owns_active_seller(p.seller_id)))
  with check (public.is_admin() or exists (select 1 from public.products p where p.id = product_id and public.owns_active_seller(p.seller_id)));
create policy options_write on public.product_options for all
  using (public.is_admin() or exists (select 1 from public.products p where p.id = product_id and public.owns_active_seller(p.seller_id)))
  with check (public.is_admin() or exists (select 1 from public.products p where p.id = product_id and public.owns_active_seller(p.seller_id)));
create policy images_write on public.product_images for all
  using (public.is_admin() or exists (select 1 from public.products p where p.id = product_id and public.owns_active_seller(p.seller_id)))
  with check (public.is_admin() or exists (select 1 from public.products p where p.id = product_id and public.owns_active_seller(p.seller_id)));

-- catalogue management is admin-only
create policy categories_admin    on public.categories    for all using (public.is_admin()) with check (public.is_admin());
create policy subcategories_admin on public.subcategories for all using (public.is_admin()) with check (public.is_admin());
create policy collections_admin   on public.collections  for all using (public.is_admin()) with check (public.is_admin());
create policy collprod_admin      on public.collection_products for all using (public.is_admin()) with check (public.is_admin());

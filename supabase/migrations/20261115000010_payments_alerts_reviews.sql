-- =============================================================================
-- 0010 · BACK-IN-STOCK ALERTS · CART REMINDERS · REVIEW PHOTOS
-- (Razorpay needs no tables: orders.payment_ref already holds the gateway ids.)
-- Safe to run more than once.
-- =============================================================================

-- ---- back-in-stock alerts: "email me when this comes back". option_value '' = any size.
create table if not exists public.stock_alerts (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  option_value text not null default '',
  email        text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  user_id      uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (product_id, option_value, email)
);
create index if not exists stock_alerts_product on public.stock_alerts (product_id);
alter table public.stock_alerts enable row level security;          -- written/read by the server (service role) only
drop policy if exists stock_alerts_admin on public.stock_alerts;
create policy stock_alerts_admin on public.stock_alerts for select using (public.is_admin());

-- ---- abandoned-cart reminders: remember when we nudged, so each cart is emailed once
alter table public.carts add column if not exists reminded_at timestamptz;

-- ---- review photos (up to 3 per review)
alter table public.reviews add column if not exists images text[] not null default '{}';
alter table public.reviews drop constraint if exists reviews_images_max3;
alter table public.reviews add constraint reviews_images_max3 check (cardinality(images) <= 3);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('review-images', 'review-images', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "review photos read" on storage.objects;
create policy "review photos read" on storage.objects for select using (bucket_id = 'review-images');
-- a signed-in customer may add / remove files only inside their own folder: review-images/<their user id>/<file>
drop policy if exists "customers add own review photos" on storage.objects;
create policy "customers add own review photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "customers delete own review photos" on storage.objects;
create policy "customers delete own review photos" on storage.objects for delete to authenticated
  using (bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text);

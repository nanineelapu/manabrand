-- =============================================================================
-- 0006 · STORAGE BUCKETS + POLICIES
-- Path convention:  product-images/<seller_id>/<product_id>/<file>
--                   seller-assets /<seller_id>/<file>      (logo, banner)
--                   seller-kyc    /<seller_id>/<file>      (PRIVATE: PAN, GST, cheque…)
--                   banners       /<file>                  (admin only)
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true,  5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('seller-assets',  'seller-assets',  true,  5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('banners',        'banners',        true,  5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('seller-kyc',     'seller-kyc',     false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

-- first folder of an object path, as a uuid (null when it is not one)
create or replace function public.path_seller(p_name text) returns uuid
language plpgsql immutable as $$
begin
  return (string_to_array(p_name, '/'))[1]::uuid;
exception when others then
  return null;
end $$;

create policy "public images read" on storage.objects for select
  using (bucket_id in ('product-images', 'seller-assets', 'banners'));

-- product images: only the ACTIVE owner of that seller folder (or admin)
create policy "seller writes own product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (public.owns_active_seller(public.path_seller(name)) or public.is_admin()));
create policy "seller updates own product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (public.owns_active_seller(public.path_seller(name)) or public.is_admin()));
create policy "seller deletes own product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (public.owns_active_seller(public.path_seller(name)) or public.is_admin()));

-- store logo/banner: the seller's owner (even while pending)
create policy "seller writes own assets" on storage.objects for insert to authenticated
  with check (bucket_id = 'seller-assets' and (public.owns_seller(public.path_seller(name)) or public.is_admin()));
create policy "seller updates own assets" on storage.objects for update to authenticated
  using (bucket_id = 'seller-assets' and (public.owns_seller(public.path_seller(name)) or public.is_admin()));
create policy "seller deletes own assets" on storage.objects for delete to authenticated
  using (bucket_id = 'seller-assets' and (public.owns_seller(public.path_seller(name)) or public.is_admin()));

-- KYC documents: private. Seller uploads/reads ONLY their own folder; admins read all.
create policy "seller uploads own kyc" on storage.objects for insert to authenticated
  with check (bucket_id = 'seller-kyc' and public.owns_seller(public.path_seller(name)));
create policy "seller reads own kyc" on storage.objects for select to authenticated
  using (bucket_id = 'seller-kyc' and (public.owns_seller(public.path_seller(name)) or public.is_admin()));

create policy "admin manages banners" on storage.objects for all to authenticated
  using (bucket_id = 'banners' and public.is_admin()) with check (bucket_id = 'banners' and public.is_admin());

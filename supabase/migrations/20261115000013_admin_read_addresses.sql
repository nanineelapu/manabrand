-- =============================================================================
-- 0013 · ADMINS CAN READ CUSTOMERS' SAVED ADDRESSES
-- Until now only the owner could read an address, so the admin panel could not show a customer's town or saved addresses.
-- Read-only for admins; customers still manage their own. Safe to run more than once.
-- =============================================================================
drop policy if exists addresses_admin_read on public.addresses;
create policy addresses_admin_read on public.addresses for select using (public.is_admin());

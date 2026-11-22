-- =============================================================================
-- 0012 · NEW-USER TRIGGER (fixes "Database error creating new user")
-- Supabase Auth's admin API can save a user first and attach app_metadata afterwards. The old trigger rejected the user
-- at the first step. This version creates the profile on whichever of the two events carries the server's mark.
-- IMPORTANT, after running this: Supabase dashboard > Authentication > Sign In / Providers > turn OFF
-- "Allow new users to sign up" (the database no longer rejects a bare signUp(), it just gives it no profile).
-- Safe to run more than once. Deletes nothing.
-- =============================================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role public.user_role;
begin
  -- Only accounts our own server created get a profile. The server marks them with app_metadata.provisioned_by.
  -- (Supabase Auth may save the user first and attach app_metadata a moment later, so this runs on INSERT and on the
  -- metadata UPDATE; whichever sees the mark first creates the profile, the other does nothing.)
  if coalesce(new.raw_app_meta_data ->> 'provisioned_by', '') <> 'mana-server' then return new; end if;
  if exists (select 1 from public.profiles where id = new.id) then return new; end if;

  v_role := coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'customer')::public.user_role;

  insert into public.profiles (id, role, full_name, phone, email, pin_changed_at)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Customer'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.email,
    now()
  );

  if v_role = 'admin' then
    insert into public.admin_members (user_id, admin_role)
    values (new.id, coalesce(new.raw_app_meta_data ->> 'admin_role', 'Support'));
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
drop trigger if exists on_auth_user_provisioned on auth.users;
create trigger on_auth_user_provisioned after update of raw_app_meta_data on auth.users
  for each row execute function public.handle_new_user();

select tgname, tgenabled from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;

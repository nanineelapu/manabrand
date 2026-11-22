-- =============================================================================
-- REPAIR: "Database error creating new user"
-- Run this in Supabase -> SQL Editor if `npm run admin:create` (or registering) says "Database error creating new user".
-- It makes sure everything the new-user trigger needs exists, then reinstalls the trigger exactly as the app expects it.
-- Safe to run more than once. It does not delete any data.
-- =============================================================================

-- 1) the three user roles must exist
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role' and typnamespace = 'public'::regnamespace) then
    create type public.user_role as enum ('customer', 'seller', 'admin');
  end if;
end $$;

-- 2) the table that records who is an admin
create table if not exists public.admin_members (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  admin_role text not null default 'Support'
             check (admin_role in ('Super admin', 'Operations', 'Support', 'Marketing')),
  created_at timestamptz not null default now()
);

-- 3) the trigger that creates a profile (and admin record) for every account our server creates
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

-- 4) show what is installed now (should list on_auth_user_created, enabled = O)
select tgname, tgenabled from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;

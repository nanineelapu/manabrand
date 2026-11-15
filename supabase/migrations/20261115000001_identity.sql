-- =============================================================================
-- 0001 · IDENTITY
-- Customers sign in with PHONE + 6-digit PIN. The PIN is stored by Supabase Auth
-- (bcrypt) as the account password — it is never stored in our tables.
-- Every account also has a real EMAIL, used for all communication and PIN reset.
-- Sellers and admins sign in with email + password.
-- =============================================================================

create type public.user_role as enum ('customer', 'seller', 'admin');

-- ---- generic helpers --------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- True when the request runs with the service-role key (server actions only).
create or replace function public.is_service() returns boolean
language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role'
$$;

-- ---- profiles ---------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  role           public.user_role not null default 'customer',
  full_name      text not null check (char_length(btrim(full_name)) between 2 and 80),
  phone          text,                                  -- E.164, Indian mobile: +919876543210
  email          text not null,                         -- real address, for all communication
  email_verified boolean not null default false,
  dob            date,
  tier           text not null default 'New'    check (tier in ('New', 'Regular', 'VIP')),
  status         text not null default 'active' check (status in ('active', 'blocked')),
  notify_orders   boolean not null default true,
  notify_offers   boolean not null default true,
  notify_whatsapp boolean not null default false,
  pin_changed_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint profiles_phone_format check (phone is null or phone ~ '^\+91[6-9][0-9]{9}$'),
  constraint profiles_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint profiles_customer_needs_phone check (role <> 'customer' or phone is not null)
);
create unique index profiles_phone_key on public.profiles (phone) where phone is not null;
create unique index profiles_email_key on public.profiles (lower(email));
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---- admin team -------------------------------------------------------------
create table public.admin_members (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  admin_role text not null default 'Support'
             check (admin_role in ('Super admin', 'Operations', 'Support', 'Marketing')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_members where user_id = auth.uid())
$$;

-- ---- brute-force protection for PIN login ----------------------------------
-- A PIN has only 1,000,000 combinations, so guessing MUST be throttled.
-- Written/read only by the server (service role). 5 failures / 15 min => locked.
create table public.login_attempts (
  id         bigint generated always as identity primary key,
  identifier text not null,                 -- normalised phone or lower(email)
  success    boolean not null,
  ip         inet,
  created_at timestamptz not null default now()
);
create index login_attempts_lookup on public.login_attempts (identifier, created_at desc);

-- ---- new-user hook: ONLY the server may create accounts ---------------------
-- Accounts are created by our server action through the admin API, which sets
-- raw_app_meta_data.provisioned_by = 'mana-server'. Anyone calling Supabase's
-- public signUp() directly is rejected, so PIN rules and phone verification of
-- uniqueness can't be bypassed. Role comes from app_metadata (server-only),
-- never from user_metadata (which a client can set).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role public.user_role;
begin
  if coalesce(new.raw_app_meta_data ->> 'provisioned_by', '') <> 'mana-server' then
    raise exception 'Direct sign-ups are disabled' using errcode = '42501';
  end if;

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

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep profile.email in sync if the auth email ever changes
create or replace function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, email_verified = false where id = new.id;
  end if;
  return new;
end $$;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- ---- a customer may edit their own profile, but never privileged columns ----
create or replace function public.protect_profile_columns() returns trigger
language plpgsql as $$
begin
  if public.is_service() or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.tier is distinct from old.tier
     or new.phone is distinct from old.phone
     or new.email is distinct from old.email
     or new.email_verified is distinct from old.email_verified then
    raise exception 'Not allowed to change protected profile fields' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---- row-level security -----------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.admin_members  enable row level security;
alter table public.login_attempts enable row level security;   -- no policies: service role only

create policy profiles_select_own   on public.profiles for select using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select using (public.is_admin());
create policy profiles_update_own   on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update using (public.is_admin());

create policy admin_members_select on public.admin_members for select
  using (user_id = auth.uid() or public.is_admin());

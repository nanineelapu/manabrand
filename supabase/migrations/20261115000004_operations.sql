-- =============================================================================
-- 0004 · OPERATIONS  (payouts, banners, notifications, support, settings, audit)
-- =============================================================================

create type public.payout_status as enum ('paid','processing','scheduled','on_hold');
create type public.banner_status as enum ('live','scheduled','draft');

create table public.payouts (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references public.sellers (id) on delete restrict,
  period_start date not null,
  period_end   date not null,
  orders_count int  not null default 0,
  gross        int  not null default 0,
  commission   int  not null default 0,
  net          int  not null default 0,
  status       public.payout_status not null default 'scheduled',
  utr          text,
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  unique (seller_id, period_start, period_end),
  check (net = gross - commission)
);

create table public.commission_rules (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete cascade,
  seller_id   uuid references public.sellers (id) on delete cascade,
  pct         numeric(4,2) not null check (pct between 0 and 40),
  check (category_id is not null or seller_id is not null)
);

create table public.banners (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  subtitle   text not null default '',
  cta        text not null default 'Shop now',
  href       text not null default '/shop',
  placement  text not null check (placement in ('home-hero','home-strip','category')),
  status     public.banner_status not null default 'draft',
  image_url  text,
  photo_kind text,
  starts_on  date,
  ends_on    date
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete cascade,   -- null + audience = broadcast to a role
  audience   text not null default 'user' check (audience in ('user','admin','seller')),
  kind       text not null check (kind in ('order','stock','seller','payout','review','system')),
  title      text not null,
  body       text not null default '',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user on public.notifications (user_id, created_at desc);

create table public.support_tickets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles (id) on delete set null,
  seller_id    uuid references public.sellers (id) on delete set null,
  topic        text not null,
  message      text not null,
  order_number text,
  status       text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at   timestamptz not null default now()
);

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  email      text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

create table public.promotions (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references public.sellers (id) on delete cascade,
  name       text not null,
  percent    int  not null check (percent between 5 and 70),
  scope      jsonb not null default '{"all": true}',
  ends_on    date,
  active     boolean not null default true
);

create table public.settings (
  key   text primary key,
  value jsonb not null
);
insert into public.settings (key, value) values
  ('shipping',   '{"freeAbove":9999999,"standardFee":99,"expressFee":149,"codFee":40}'),
  ('payments',   '{"upi":true,"card":true,"netbanking":true,"cod":true,"wallet":false}'),
  ('commission', '{"default":12}'),
  ('business',   '{"name":"ManaBrand Pvt. Ltd.","supportEmail":"care@manabrand.in","supportPhone":"1800-120-6262"}');

create table public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  text,
  diff       jsonb,
  created_at timestamptz not null default now()
);

-- ---- row-level security -----------------------------------------------------
alter table public.payouts                enable row level security;
alter table public.commission_rules       enable row level security;
alter table public.banners                enable row level security;
alter table public.notifications          enable row level security;
alter table public.support_tickets        enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.newsletter_subscribers enable row level security;   -- insert via server only
alter table public.promotions             enable row level security;
alter table public.settings               enable row level security;
alter table public.audit_log              enable row level security;

create policy payouts_own   on public.payouts for select using (public.owns_seller(seller_id));
create policy payouts_admin on public.payouts for all using (public.is_admin()) with check (public.is_admin());
create policy commission_admin on public.commission_rules for all using (public.is_admin()) with check (public.is_admin());

create policy banners_live  on public.banners for select
  using (status = 'live' and (starts_on is null or starts_on <= current_date) and (ends_on is null or ends_on >= current_date));
create policy banners_admin on public.banners for all using (public.is_admin()) with check (public.is_admin());

create policy notif_own    on public.notifications for select using (user_id = auth.uid());
create policy notif_own_upd on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_admin  on public.notifications for all
  using (public.is_admin() and (audience = 'admin' or user_id = auth.uid())) with check (public.is_admin());

create policy tickets_own on public.support_tickets for select using (user_id = auth.uid() or public.owns_seller(seller_id));
create policy tickets_insert on public.support_tickets for insert
  with check (user_id = auth.uid() or public.owns_seller(seller_id));
create policy tickets_admin on public.support_tickets for all using (public.is_admin()) with check (public.is_admin());

create policy contact_admin    on public.contact_messages        for all using (public.is_admin()) with check (public.is_admin());
create policy newsletter_admin on public.newsletter_subscribers  for all using (public.is_admin()) with check (public.is_admin());

create policy promotions_own   on public.promotions for all using (public.owns_active_seller(seller_id)) with check (public.owns_active_seller(seller_id));
create policy promotions_admin on public.promotions for all using (public.is_admin()) with check (public.is_admin());

-- shipping/payment rules are public (the cart needs them); everything else admin-only
create policy settings_public on public.settings for select using (key in ('shipping', 'payments'));
create policy settings_admin  on public.settings for all using (public.is_admin()) with check (public.is_admin());

create policy audit_admin on public.audit_log for select using (public.is_admin());

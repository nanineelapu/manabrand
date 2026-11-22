-- =============================================================================
-- 0009 · ADMIN TOOLS
--  · SEO fields on products (search-result title + description)
--  · the Mana Deal Box settings row (hours, price, picked products) — readable by shoppers, editable by admins
-- Safe to run more than once.
-- =============================================================================
alter table public.products
  add column if not exists seo_title       text check (seo_title is null or char_length(seo_title) <= 70),
  add column if not exists seo_description text check (seo_description is null or char_length(seo_description) <= 170);

insert into public.settings (key, value) values
  ('dealbox', '{"enabled":true,"allDay":true,"startHour":20,"endHour":22,"price":699,"productIds":[]}')
on conflict (key) do nothing;

-- shoppers may read the shipping + payments + dealbox settings (everything else stays admin-only)
drop policy if exists settings_public on public.settings;
create policy settings_public on public.settings for select using (key in ('shipping', 'payments', 'dealbox'));

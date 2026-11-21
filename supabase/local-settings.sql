-- Run once in Supabase -> SQL Editor on a database created BEFORE the Ichapuram / fashion changes.
-- Updates the settings rows (the shipping rule and the support contact). Safe to re-run; touches nothing else.
insert into public.settings (key, value) values
  ('shipping', '{"freeAbove":9999999,"standardFee":99,"expressFee":149,"codFee":40}'),
  ('business', '{"name":"ManaBrand","supportEmail":"care@manabrand.in","supportPhone":"+91 831 765 8309"}')
on conflict (key) do update set value = public.settings.value || excluded.value;   -- keeps any other keys you added

-- ManaBrand is now a fashion-only marketplace.
-- Run once in Supabase -> SQL Editor on a database that was seeded BEFORE this change.
-- (Fresh setups don't need this: supabase/seed.sql already contains only fashion + accessories.)
--
-- What it does
--   1) non-fashion products with no orders are deleted; ones that already have orders are set to "draft" (hidden, history kept)
--   2) Electronics / Home / Beauty / Gourmet categories (and their sub-categories) are deleted once nothing points to them
--   3) the old general-store collections are replaced by fashion collections
--   4) the sample sellers that only sold non-fashion goods are suspended

begin;

-- 1) products --------------------------------------------------------------------------------------------
delete from public.products p
 using public.categories c
 where p.category_id = c.id
   and c.slug in ('electronics', 'home', 'beauty', 'gourmet')
   and not exists (select 1 from public.order_items oi where oi.product_id = p.id);

update public.products p set status = 'draft'
  from public.categories c
 where p.category_id = c.id
   and c.slug in ('electronics', 'home', 'beauty', 'gourmet');

-- the smart watch lived under Accessories
delete from public.products p
 where p.name = 'Smart Fitness Watch'
   and not exists (select 1 from public.order_items oi where oi.product_id = p.id);
update public.products set status = 'draft' where name = 'Smart Fitness Watch';

-- 2) categories (sub-categories go with them) ------------------------------------------------------------
delete from public.categories c
 where c.slug in ('electronics', 'home', 'beauty', 'gourmet')
   and not exists (select 1 from public.products p where p.category_id = c.id);

-- 3) collections -----------------------------------------------------------------------------------------
delete from public.collections where slug in ('work-from-home', 'gift-guide', 'home-refresh');

insert into public.collections (slug, name, story, photo_kind, sort) values
  ('street-style',     'Street Style',     'Shirts, denim and layers for everyday menswear.',          'jacket',    1),
  ('gifts-to-wear',    'Gifts to Wear',    'Jewellery, watches and bags — presents people actually wear.', 'jewellery', 2),
  ('everyday-comfort', 'Everyday Comfort', 'Soft tees, easy dresses and sneakers for every day.',      'tee',       3)
on conflict (slug) do update set name = excluded.name, story = excluded.story, photo_kind = excluded.photo_kind, sort = excluded.sort;

-- fill them (matches on the start of the product name)
with picks(slug, prefix, ord) as (values
  ('street-style','Slim Fit Oxford',0), ('street-style','Chambray',1), ('street-style','Linen Camp',2), ('street-style','Selvedge',3),
  ('street-style','Washed Denim Trucker',4), ('street-style','Quilted Bomber',5), ('street-style','Heavyweight Boxy',6),
  ('gifts-to-wear','Pearl',0), ('gifts-to-wear','Gold-tone',1), ('gifts-to-wear','Classic Steel',2),
  ('gifts-to-wear','Market Tote',3), ('gifts-to-wear','Aviator',4), ('gifts-to-wear','Slouchy',5),
  ('everyday-comfort','Soft Knit',0), ('everyday-comfort','Oversized Fleece',1), ('everyday-comfort','Floral Wrap',2),
  ('everyday-comfort','Ribbed Wrap',3), ('everyday-comfort','High-rise Mom',4), ('everyday-comfort','Cloudstep',5), ('everyday-comfort','Canvas Court',6)
)
insert into public.collection_products (collection_id, product_id, sort)
select col.id, p.id, pk.ord
  from picks pk
  join public.collections col on col.slug = pk.slug
  join public.products p on p.name like pk.prefix || '%'
on conflict do nothing;

-- 4) sellers that only sold non-fashion goods ------------------------------------------------------------
update public.sellers set status = 'suspended'
 where slug in ('voltedge', 'hearth-and-home', 'glow-theory', 'spice-route');

-- the watch, necklace, earrings and sunglasses are sold by Shekar Studio & Gift Shop
update public.products set seller_id = (select id from public.sellers where slug = 'shekar-studio-gift-shop')
 where name in ('Classic Steel Watch', 'Pearl Strand Necklace', 'Gold-tone Hoop Earrings', 'Aviator Sunglasses');

commit;

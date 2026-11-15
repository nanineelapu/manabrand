-- Makes the sample sellers local to Ichapuram and sets up the real shop "Shekar Studio & Gift Shop".
-- Run once in Supabase -> SQL Editor. (Fresh setups don't need this: supabase/seed.sql already has the same data.)

-- 1) the old "Indigo Loom" denim range moves to Urban Thread
update public.products set seller_id = (select id from public.sellers where slug = 'urban-thread')
 where seller_id = (select id from public.sellers where slug = 'indigo-loom');

-- 2) Indigo Loom's row becomes Shekar Studio & Gift Shop
update public.sellers set
  slug = 'shekar-studio-gift-shop', name = 'Shekar Studio & Gift Shop', owner_name = 'S Shekar',
  city = 'Ichapuram', state = 'Andhra Pradesh', pickup_address = 'Near Sri Laxmi Surya Lodge, Ichapuram, Andhra Pradesh',
  blurb = 'Studio and gift shop in Ichapuram, near Sri Laxmi Surya Lodge — thoughtful gifts for every occasion.'
 where slug = 'indigo-loom';

-- 3) gift-type products now belong to the gift shop
update public.products set seller_id = (select id from public.sellers where slug = 'shekar-studio-gift-shop')
 where name in ('Eau de Parfum Noir', 'Soy Wax Scented Candle', 'Dark Chocolate Gift Box');

-- 4) every other sample seller is local too
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Hand-block printed cottons and natural-dye ethnic wear from local Ichapuram artisans.' where slug = 'kalamkari-co';
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Silk sarees and fine jewellery from a family-run Ichapuram shop.' where slug = 'banarasi-house';
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Streetwear essentials — heavyweight tees, hoodies and layers, from an Ichapuram studio.' where slug = 'urban-thread';
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Comfort-first sneakers, bags and eyewear, sold locally in Ichapuram.' where slug = 'stride-lab';
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Festive and contemporary wear stitched by Ichapuram tailors.' where slug = 'saanjh-studio';
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Festive wear from local Ichapuram tailors.' where slug = 'tarang-weaves';
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Ichapuram’s authorised reseller of phones, audio and laptops, with 1-year brand warranty.' where slug = 'voltedge';
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Local furniture, decor and kitchenware to make a house feel like home.' where slug = 'hearth-and-home';
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Dermatologist-tested skincare, makeup and fragrance, available in Ichapuram.' where slug = 'glow-theory';
update public.sellers set city = 'Ichapuram', state = 'Andhra Pradesh', blurb = 'Single-origin coffee, estate teas and whole spices, packed at an Ichapuram pantry.' where slug = 'spice-route';

-- Removes the sample mobile phones from the shop. Run once in Supabase -> SQL Editor.
-- (Fresh setups don't need this: supabase/seed.sql no longer contains them.)

-- hide the phones (archived rather than deleted, so any past orders keep working)
update public.products set status = 'draft', subcategory_id = null
 where name in ('Nova 5G Smartphone', 'Lumen Pro Camera Phone', 'Lite Android Phone');

-- drop the now-empty "Mobiles" sub-category
delete from public.subcategories
 where name = 'Mobiles'
   and category_id = (select id from public.categories where slug = 'electronics');

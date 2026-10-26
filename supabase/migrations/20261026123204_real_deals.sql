-- Real deals (2026-10-26): the locked "sample deals" become real deals on branded products that
-- shops can join. The eight existing products are renamed to the brands in their photos
-- (public/images/products), four products for salons, car washes and bakeries are added, the old
-- sample pools are removed, and one open deal per product is published around Cape Town.
-- List and bulk prices are estimates of Cape Town cash & carry prices, not supplier quotes: get a
-- real quote before verifying any payment. is_sample stays in place for future sample deals.

-- ===== Categories for the non-grocery products =====
insert into public.categories (name, slug, sort) values
  ('Hair & Beauty', 'hair-beauty', 9),
  ('Car Care', 'car-care', 10),
  ('Baking', 'baking', 11)
on conflict (slug) do nothing;

-- ===== Products: the brands in the photos, plus stock for other kinds of business =====
insert into public.products (sku, name, brand, description, unit, pack_size, image_url, category_id)
select v.sku, v.name, v.brand, v.description, v.unit, v.pack_size, v.image_url,
  (select id from public.categories where slug = v.category)
from (values
  ('KP-OIL-2L6', 'Crown Blended Cooking Oil', 'Crown', 'Triple refined blended oil for frying, roasting and salads.', 'carton', '2L x 6 bottles', '/images/products/kp-oil-2l6.jpg', 'cooking-oil'),
  ('KP-SUG-10', 'Huletts White Sugar', 'Huletts', 'White sugar in 1kg packs, ready to sell.', 'bale', '1kg x 10', '/images/products/kp-sug-10.jpg', 'sugar'),
  ('KP-RIC-10', 'Tastic Long Grain Parboiled Rice', 'Tastic', 'Long grain parboiled rice.', 'bag', '10kg bag', '/images/products/kp-ric-10.jpg', 'rice'),
  ('KP-MAI-10', 'Star Super Maize Meal', 'Star', 'Super maize meal for pap.', 'bag', '10kg bag', '/images/products/kp-mai-10.jpg', 'maize-meal'),
  ('KP-FLR-10', 'Snowflake Cake Wheat Flour', 'Snowflake', 'Cake wheat flour for baking and vetkoek.', 'bag', '10kg bag', '/images/products/kp-flr-10.jpg', 'flour'),
  ('KP-BEV-2L6', 'Coca-Cola Original', 'Coca-Cola', 'Coca-Cola in 2 litre bottles.', 'case', '2L x 6 bottles', '/images/products/kp-bev-2l6.jpg', 'beverages'),
  ('KP-DSH-750', 'Sunlight Dishwashing Liquid Lemon', 'Sunlight', 'Lemon dishwashing liquid.', 'box', '750ml x 12', '/images/products/kp-dsh-750.jpg', 'cleaning'),
  ('KP-SAL-1', 'Cerebos Iodated Table Salt', 'Cerebos', 'Iodated table salt in 1kg packs.', 'bale', '1kg x 10', '/images/products/kp-sal-1.jpg', 'other'),
  ('KP-BRD-125', 'Snowflake White Bread Flour', 'Snowflake', 'Bread flour for bakeries and home bakers.', 'bag', '12.5kg bag', null, 'baking'),
  ('KP-YST-500', 'Anchor Instant Dry Yeast', 'Anchor', 'Instant dry yeast for bread and vetkoek.', 'pack', '500g pack', null, 'baking'),
  ('KP-RLX-6', 'Dark and Lovely Relaxer Kit', 'Dark and Lovely', 'Hair relaxer kits for salons.', 'box', '6 kits', null, 'hair-beauty'),
  ('KP-CAR-5L4', 'Shield Car Wash Shampoo', 'Shield', 'Car wash shampoo for hand washing.', 'box', '5L x 4', null, 'car-care')
) as v (sku, name, brand, description, unit, pack_size, image_url, category)
on conflict (sku) do update set
  name = excluded.name, brand = excluded.brand, description = excluded.description,
  unit = excluded.unit, pack_size = excluded.pack_size, image_url = excluded.image_url,
  category_id = excluded.category_id, active = true;

-- ===== Stand-in supplier for these deals =====
insert into public.suppliers (id, name, location, categories, notes)
values ('ca5e0000-0000-4000-8000-000000000001', 'Cape Town Cash & Carry (stand-in)', 'Cape Town',
  '{Cooking Oil,Sugar,Rice,Maize Meal,Flour,Beverages,Cleaning Products,Other Groceries,Baking,Hair & Beauty,Car Care}',
  'Stand-in supplier for the first real deals. Prices are estimates: replace with a real supplier and quote before verifying payments.')
on conflict (id) do nothing;

-- ===== Remove the old sample pools (nobody could join them) =====
do $$
declare ids uuid[];
begin
  select array_agg(id) into ids from public.pools where is_sample;
  if ids is null then return; end if;
  delete from public.refunds where order_id in (select id from public.orders where pool_id = any(ids));
  delete from public.payments where order_id in (select id from public.orders where pool_id = any(ids));
  delete from public.orders where pool_id = any(ids);
  delete from public.purchase_orders where pool_id = any(ids);
  delete from public.pools where id = any(ids); -- costs, interest, members and centres cascade
end $$;

-- ===== One open deal per product, centred on Cape Town townships =====
do $$
declare d record; pid uuid; share numeric := public.discount_share_pct();
begin
  for d in select v.*, pr.id as product_id, pr.unit
    from (values
      ('KP-MAI-10', 105, 90, 60, 20, 12, -34.0400, 18.6750, 'Khayelitsha'),
      ('KP-OIL-2L6', 345, 300, 40, 10, 12, -34.0400, 18.6750, 'Khayelitsha'),
      ('KP-SUG-10', 235, 205, 50, 15, 10, -33.9800, 18.5700, 'Gugulethu'),
      ('KP-RIC-10', 189, 165, 50, 15, 14, -33.9800, 18.5700, 'Gugulethu'),
      ('KP-FLR-10', 165, 145, 40, 15, 12, -33.9440, 18.5290, 'Langa'),
      ('KP-BEV-2L6', 150, 130, 80, 30, 9, -33.9440, 18.5290, 'Langa'),
      ('KP-DSH-750', 360, 315, 20, 5, 14, -34.0480, 18.6160, 'Mitchells Plain'),
      ('KP-SAL-1', 130, 110, 30, 10, 14, -34.0480, 18.6160, 'Mitchells Plain'),
      ('KP-BRD-125', 190, 165, 40, 15, 12, -34.0100, 18.5900, 'Philippi'),
      ('KP-YST-500', 95, 80, 30, 10, 12, -34.0100, 18.5900, 'Philippi'),
      ('KP-RLX-6', 480, 410, 20, 5, 14, -33.9930, 18.5850, 'Nyanga'),
      ('KP-CAR-5L4', 520, 440, 15, 5, 14, -33.9700, 18.6400, 'Delft')
    ) as v (sku, list_price, bulk_price, min_qty, max_per, days, lat, lon, area)
    join public.products pr on pr.sku = v.sku
  loop
    insert into public.pools (product_id, supplier_id, unit, price, reference_price, reference_source,
        reference_date, min_qty, max_per_customer, opens_at, closes_at, confirm_window_hours,
        fulfilment_note, status, discount_share_pct)
      values (d.product_id, 'ca5e0000-0000-4000-8000-000000000001', d.unit,
        public.pool_price(d.list_price, d.bulk_price, share), d.list_price,
        'Estimated cash & carry price, October 2026', current_date, d.min_qty, d.max_per,
        now(), now() + make_interval(days => d.days), 48,
        'Delivered to your shop about 5 working days after everyone has paid.', 'open', share)
      returning id into pid;
    insert into public.pool_costs (pool_id, supplier_cost) values (pid, d.bulk_price);
    insert into public.pool_locations (pool_id, latitude, longitude, radius_km, label)
      values (pid, d.lat, d.lon, 10, d.area);
  end loop;
end $$;


do $$
declare
  c_oil uuid; c_rice uuid; c_sugar uuid; c_maize uuid; c_flour uuid; c_bev uuid; c_clean uuid; c_other uuid;
  cp uuid; s1 uuid; s2 uuid; camp uuid;
  p_oil uuid; p_sugar uuid; p_rice uuid; p_maize uuid; p_flour uuid; p_bev uuid; p_dish uuid;
  pl uuid; biz uuid[] := '{}'; uids uuid[] := '{}'; b uuid; u uuid; i int; part uuid; q int; o uuid;
  names text[] := array['Mama Thandi Spaza','Sipho''s Corner Shop','Lerato Tuck Shop','Bongani General Dealer','Kasi Fresh Mini Market','Nomsa''s Kitchen','Ekasi Groceries','Zanele Spaza','Tumi Supply Store','Ubuntu Corner Café','Mpho''s Mini Mart','Jabu Fast Foods','Khanyi Tuck Shop','Lindiwe Groceries','Sizwe Spaza'];
  reps text[] := array['Thandi Mokoena','Sipho Dlamini','Lerato Nkosi','Bongani Khumalo','Palesa Molefe','Nomsa Zulu','Kagiso Sithole','Zanele Mahlangu','Tumi Ndlovu','Ayanda Mthembu','Mpho Radebe','Jabu Ngcobo','Khanyi Shabalala','Lindiwe Cele','Sizwe Mkhize'];
  towns text[] := array['Soweto','Soweto','Alexandra','Tembisa','Soweto','Diepsloot','Alexandra','Tembisa','Soweto','Diepsloot','Soweto','Tembisa','Alexandra','Soweto','Diepsloot'];
  oilq int[] := array[5,3,4,2,6,3,4,5,2,4,3,4];
  sugq int[] := array[6,4,5,3,8,4,5,6,3,5,4,5,4,3,5];
  riceq int[] := array[6,5,4,7,5,6,5,6];
  maizeq int[] := array[10,8,12,9,8,9];
  flourq int[] := array[6,5,8,4,7];
  bevq int[] := array[5,4,6,3,5,4,4];
begin
  insert into categories(name,slug,sort) values ('Cooking Oil','cooking-oil',1) returning id into c_oil;
  insert into categories(name,slug,sort) values ('Rice','rice',2) returning id into c_rice;
  insert into categories(name,slug,sort) values ('Sugar','sugar',3) returning id into c_sugar;
  insert into categories(name,slug,sort) values ('Maize Meal','maize-meal',4) returning id into c_maize;
  insert into categories(name,slug,sort) values ('Flour','flour',5) returning id into c_flour;
  insert into categories(name,slug,sort) values ('Beverages','beverages',6) returning id into c_bev;
  insert into categories(name,slug,sort) values ('Cleaning Products','cleaning',7) returning id into c_clean;
  insert into categories(name,slug,sort) values ('Other Groceries','other',8) returning id into c_other;

  insert into collection_points(name, area, address, instructions, fee_note)
  values ('KasiPool Demo Collection Point – Orlando West','Orlando West, Soweto, Gauteng','Demo address (to be confirmed)',
    'Bring your collection code and ID. Collection times will be confirmed by KasiPool once stock arrives.','No collection fee') returning id into cp;

  insert into suppliers(name, contact_person, mobile, location, categories, notes, is_demo)
  values ('Demo Wholesale Supplier A','Demo Contact','+27 11 000 0001','Johannesburg South','{Cooking Oil,Rice,Sugar,Maize Meal,Flour}','FICTIONAL demo supplier',true) returning id into s1;
  insert into suppliers(name, contact_person, mobile, location, categories, notes, is_demo)
  values ('Demo Beverage & Cleaning Distributor','Demo Contact','+27 11 000 0002','Midrand','{Beverages,Cleaning Products}','FICTIONAL demo supplier',true) returning id into s2;

  insert into products(sku,name,category_id,brand,description,unit,pack_size,image_url,is_demo) values
   ('KP-OIL-2L6','Sunflower Cooking Oil',c_oil,'Generic (demo)','Refined sunflower oil for frying and cooking.','carton','2L × 6 bottles','/images/oil.jpg',true) returning id into p_oil;
  insert into products(sku,name,category_id,brand,description,unit,pack_size,image_url,is_demo) values
   ('KP-SUG-10','White Sugar',c_sugar,'Generic (demo)','Fine white sugar.','bag','10kg bag','/images/sugar.jpg',true) returning id into p_sugar;
  insert into products(sku,name,category_id,brand,description,unit,pack_size,image_url,is_demo) values
   ('KP-RIC-10','Long Grain Rice',c_rice,'Generic (demo)','Long grain parboiled rice.','bag','10kg bag','/images/rice.jpg',true) returning id into p_rice;
  insert into products(sku,name,category_id,brand,description,unit,pack_size,image_url,is_demo) values
   ('KP-MAI-10','Super Maize Meal',c_maize,'Generic (demo)','Super refined white maize meal.','bag','10kg bag','/images/maize.jpg',true) returning id into p_maize;
  insert into products(sku,name,category_id,brand,description,unit,pack_size,image_url,is_demo) values
   ('KP-FLR-10','All-Purpose Flour',c_flour,'Generic (demo)','Cake and baking flour.','bag','10kg bag','/images/flour.jpg',true) returning id into p_flour;
  insert into products(sku,name,category_id,brand,description,unit,pack_size,image_url,is_demo) values
   ('KP-BEV-2L6','Cola Soft Drink',c_bev,'Generic (demo)','Carbonated soft drink.','case','2L × 6 bottles','/images/cola.jpg',true) returning id into p_bev;
  insert into products(sku,name,category_id,brand,description,unit,pack_size,image_url,is_demo) values
   ('KP-DSH-750','Dishwashing Liquid',c_clean,'Generic (demo)','Lemon dishwashing liquid.','box','750ml × 12','/images/dish.jpg',true) returning id into p_dish;
  insert into products(sku,name,category_id,brand,description,unit,pack_size,image_url,is_demo) values
   ('KP-SAL-1','Table Salt',c_other,'Generic (demo)','Iodated table salt.','bale','1kg × 10','/images/salt.jpg',true);

  insert into campaigns(name, description, is_demo) values ('October Spaza Essentials','Everyday staples for spaza shops and tuck shops. DEMO campaign with fictional prices.',true) returning id into camp;

  for i in 1..15 loop
    u := gen_random_uuid();
    insert into businesses(user_id, trading_name, rep_name, mobile, category, township, city, province, is_demo)
    values (u, names[i] || ' (Demo)', reps[i], '+27 7' || lpad((10000000 + i*137)::text, 8, '0'), 'Spaza / tuck shop', towns[i], 'Johannesburg', 'Gauteng', true) returning id into b;
    biz := biz || b; uids := uids || u;
  end loop;

  -- Pool A: cooking oil (open)
  insert into pools(campaign_id, product_id, supplier_id, unit, price, reference_price, reference_source, reference_date, min_qty, max_qty, max_per_customer, opens_at, closes_at, collection_point_id, fulfilment_note, status, is_demo)
  values (camp, p_oil, s1, 'carton', 219, 240, 'Demo: illustrative wholesale shelf price', current_date - 3, 60, 120, 20, now() - interval '4 days', now() + interval '3 days 5 hours', cp, 'Supplier delivery expected within 5 working days of funding (demo).', 'open', true) returning id into pl;
  insert into pool_costs values (pl, 198);
  for i in 1..12 loop insert into participations(pool_id,user_id,business_id,quantity) values (pl, uids[i], biz[i], oilq[i]); end loop;

  -- Pool B: sugar (open)
  insert into pools(campaign_id, product_id, supplier_id, unit, price, reference_price, reference_source, reference_date, min_qty, max_per_customer, opens_at, closes_at, collection_point_id, status, is_demo)
  values (camp, p_sugar, s1, 'bag', 189, 205, 'Demo: illustrative wholesale shelf price', current_date - 2, 100, 25, now() - interval '3 days', now() + interval '5 days', cp, 'open', true) returning id into pl;
  insert into pool_costs values (pl, 172);
  for i in 1..15 loop insert into participations(pool_id,user_id,business_id,quantity) values (pl, uids[i], biz[i], sugq[i]); end loop;

  -- Dishwashing (open, no reference price -> no savings claim)
  insert into pools(campaign_id, product_id, supplier_id, unit, price, min_qty, opens_at, closes_at, collection_point_id, status, is_demo)
  values (null, p_dish, s2, 'box', 265, 30, now() - interval '1 day', now() + interval '6 days', cp, 'open', true) returning id into pl;
  insert into pool_costs values (pl, 240);
  for i in 1..4 loop insert into participations(pool_id,user_id,business_id,quantity) values (pl, uids[i+3], biz[i+3], 2 + i); end loop;

  -- Pool C: rice (awaiting confirmation)
  insert into pools(campaign_id, product_id, supplier_id, unit, price, reference_price, reference_source, reference_date, min_qty, opens_at, closes_at, collection_point_id, status, qualified_at, closed_at, payment_deadline, is_demo)
  values (camp, p_rice, s1, 'bag', 165, 182, 'Demo: illustrative wholesale shelf price', current_date - 6, 40, now() - interval '6 days', now() - interval '4 hours', cp, 'awaiting_confirmation', now() - interval '4 hours', now() - interval '4 hours', now() + interval '20 hours', true) returning id into pl;
  insert into pool_costs values (pl, 150);
  for i in 1..8 loop
    insert into participations(pool_id,user_id,business_id,quantity,status) values (pl, uids[i], biz[i], riceq[i], 'converted') returning id into part;
    insert into orders(pool_id, participation_id, user_id, business_id, quantity, unit_price, total, status, is_demo, ref, payment_reference, confirmed_at, terms_version, payment_status, amount_paid, paid_at)
    values (pl, part, uids[i], biz[i], riceq[i], 165, 165*riceq[i],
      case when i <= 5 then 'confirmed' else 'awaiting_confirmation' end, true,
      case when i <= 5 then 'KP-DEMO-R' || i end, case when i <= 5 then 'KP-DEMO-R' || i end,
      case when i <= 5 then now() - interval '3 hours' end, case when i <= 5 then 'v0.1-draft' end,
      case when i <= 3 then 'paid' when i <= 5 then 'awaiting_payment' else 'not_due' end,
      case when i <= 3 then 165*riceq[i] else 0 end, case when i <= 3 then now() - interval '2 hours' end);
  end loop;

  -- Pool D: maize (procurement)
  insert into pools(campaign_id, product_id, supplier_id, unit, price, reference_price, reference_source, reference_date, min_qty, opens_at, closes_at, collection_point_id, status, qualified_at, closed_at, payment_deadline, is_demo)
  values (camp, p_maize, s1, 'bag', 142, 155, 'Demo: illustrative wholesale shelf price', current_date - 10, 50, now() - interval '12 days', now() - interval '5 days', cp, 'funded', now() - interval '5 days', now() - interval '5 days', now() - interval '4 days', true) returning id into pl;
  insert into pool_costs values (pl, 128);
  for i in 1..6 loop
    insert into participations(pool_id,user_id,business_id,quantity,status) values (pl, uids[i+2], biz[i+2], maizeq[i], 'converted') returning id into part;
    insert into orders(pool_id, participation_id, user_id, business_id, quantity, unit_price, total, status, is_demo, ref, payment_reference, confirmed_at, terms_version, payment_status, amount_paid, paid_at, fulfilment_status)
    values (pl, part, uids[i+2], biz[i+2], maizeq[i], 142, 142*maizeq[i], 'confirmed', true, 'KP-DEMO-M' || i, 'KP-DEMO-M' || i, now() - interval '5 days', 'v0.1-draft', 'paid', 142*maizeq[i], now() - interval '4 days 6 hours', 'ordered');
  end loop;
  insert into purchase_orders(pool_id, supplier_id, quantity, unit_cost, total, supplier_ref, order_date, expected_date)
  values (pl, s1, 56, 128, 128*56, 'DEMO-SUP-4471', current_date - 3, current_date + 2);
  update pools set status = 'procurement' where id = pl;

  -- Pool E: flour (ready for collection)
  insert into pools(campaign_id, product_id, supplier_id, unit, price, reference_price, reference_source, reference_date, min_qty, opens_at, closes_at, collection_point_id, status, qualified_at, closed_at, payment_deadline, is_demo)
  values (camp, p_flour, s1, 'bag', 158, 172, 'Demo: illustrative wholesale shelf price', current_date - 14, 30, now() - interval '16 days', now() - interval '10 days', cp, 'funded', now() - interval '10 days', now() - interval '10 days', now() - interval '9 days', true) returning id into pl;
  insert into pool_costs values (pl, 143);
  for i in 1..5 loop
    insert into participations(pool_id,user_id,business_id,quantity,status) values (pl, uids[i+5], biz[i+5], flourq[i], 'converted') returning id into part;
    insert into orders(pool_id, participation_id, user_id, business_id, quantity, unit_price, total, status, is_demo, ref, payment_reference, confirmed_at, terms_version, payment_status, amount_paid, paid_at, fulfilment_status, allocated_qty, collection_code, ready_at, collected_at)
    values (pl, part, uids[i+5], biz[i+5], flourq[i], 158, 158*flourq[i], 'confirmed', true, 'KP-DEMO-F' || i, 'KP-DEMO-F' || i, now() - interval '10 days', 'v0.1-draft', 'paid', 158*flourq[i], now() - interval '9 days 12 hours',
      case when i = 1 then 'collected' else 'ready' end, flourq[i], 'DEMO' || i || 'F', now() - interval '1 day', case when i = 1 then now() - interval '5 hours' end);
  end loop;
  insert into purchase_orders(pool_id, supplier_id, quantity, unit_cost, total, supplier_ref, order_date, expected_date, status, received_qty, received_at)
  values (pl, s1, 30, 143, 143*30, 'DEMO-SUP-4390', current_date - 8, current_date - 2, 'received', 30, now() - interval '1 day');
  update pools set status = 'ready_for_collection' where id = pl;

  -- Pool F: cola (unsuccessful)
  insert into pools(campaign_id, product_id, supplier_id, unit, price, reference_price, reference_source, reference_date, min_qty, opens_at, closes_at, collection_point_id, status, closed_at, outcome_note, is_demo)
  values (null, p_bev, s2, 'case', 118, 126, 'Demo: illustrative wholesale shelf price', current_date - 9, 80, now() - interval '9 days', now() - interval '2 days', cp, 'unsuccessful', now() - interval '2 days', 'Minimum target not reached by the closing time.', true) returning id into pl;
  insert into pool_costs values (pl, 108);
  for i in 1..7 loop insert into participations(pool_id,user_id,business_id,quantity) values (pl, uids[i+8], biz[i+8], bevq[i]); end loop;
end $$;

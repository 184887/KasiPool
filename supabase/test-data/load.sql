-- Test data for trying every KasiPool flow (see docs/testing.md). Run clear.sql first; the npm
-- scripts do both: npm run test-data (local stack).
--
-- Makes 7 test shops around Cape Town (log in with their number and PIN 123456) and 13 pools in
-- the "Test data" campaign, one for each stage of the pool lifecycle. Every step runs through the
-- app's own database functions, acting as each shop or as the first admin, so the data obeys the
-- same rules as real use. Pools are centred on the Cape Flats (15 km), so shop 7 in Mbekweni is
-- too far away to join them.

-- ===== Helpers (pg_temp: they disappear when this session ends) =====
create function pg_temp.act_as(_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', _uid, 'role', 'authenticated')::text, false);
end $$;

create function pg_temp.admin() returns uuid language sql stable as $$
  select current_setting('kasipool.test_admin')::uuid
$$;

create function pg_temp.shop(_n int) returns uuid language sql stable as $$
  select id from auth.users where email = '2760000000' || _n || '@phone.kasipool.co.za'
$$;

create function pg_temp.order_of(_n int, _pool uuid) returns uuid language sql stable as $$
  select id from public.orders where pool_id = _pool and user_id = pg_temp.shop(_n)
  order by created_at desc limit 1
$$;

create function pg_temp.make_shop(_n int, _name text, _rep text, _category text, _township text,
  _address text, _lat double precision, _lon double precision) returns void language plpgsql as $$
declare uid uuid := gen_random_uuid(); login text := '2760000000' || _n || '@phone.kasipool.co.za';
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token,
      recovery_token, email_change_token_new, email_change, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', login,
      extensions.crypt('123456', extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"], "test_data": true}', '{}', now(), now(),
      '', '', '', '', '', '', '', '');
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at,
      updated_at, last_sign_in_at)
    values (uid::text, uid, jsonb_build_object('sub', uid::text, 'email', login,
      'email_verified', true), 'email', now(), now(), now());
  insert into public.businesses (user_id, trading_name, rep_name, mobile, category, township, city,
      province, address, latitude, longitude)
    values (uid, _name, _rep, '+2760000000' || _n, _category, _township, 'Cape Town',
      'Western Cape', _address, _lat, _lon);
end $$;

-- A published pool in the test campaign, centred on the Cape Flats
create function pg_temp.make_pool(_sku text, _list numeric, _bulk numeric, _min int, _max_per int,
  _opens interval default interval '-2 days') returns uuid language plpgsql as $$
declare pid uuid; pr public.products;
begin
  select * into pr from public.products where sku = _sku;
  insert into public.pools (campaign_id, product_id, supplier_id, unit, reference_price,
      reference_source, reference_date, min_qty, max_per_customer, opens_at, closes_at,
      confirm_window_hours, fulfilment_note)
    values ('7e57da7a-0000-4000-8000-000000000001', pr.id, 'ca5e0000-0000-4000-8000-000000000001',
      pr.unit, _list, 'Estimated cash & carry price, October 2026', current_date, _min, _max_per,
      now() + _opens, now() + interval '7 days', 48, 'Test pool: no stock will be delivered.')
    returning id into pid;
  insert into public.pool_costs (pool_id, supplier_cost) values (pid, _bulk);
  insert into public.pool_locations (pool_id, latitude, longitude, radius_km, label)
    values (pid, -34.0000, 18.6000, 15, 'Cape Flats (test)');
  perform pg_temp.act_as(pg_temp.admin());
  perform public.admin_publish_pool(pid);
  return pid;
end $$;

create function pg_temp.join(_n int, _pool uuid, _qty int) returns void language plpgsql as $$
begin
  perform pg_temp.act_as(pg_temp.shop(_n));
  perform public.join_pool(_pool, _qty);
end $$;

create function pg_temp.confirm(_n int, _pool uuid) returns void language plpgsql as $$
begin
  perform pg_temp.act_as(pg_temp.shop(_n));
  perform public.confirm_order(pg_temp.order_of(_n, _pool), true);
end $$;

-- Confirm, then the admin records the full EFT as verified
create function pg_temp.pay(_n int, _pool uuid) returns void language plpgsql as $$
declare o public.orders;
begin
  perform pg_temp.confirm(_n, _pool);
  select * into o from public.orders where id = pg_temp.order_of(_n, _pool);
  perform pg_temp.act_as(pg_temp.admin());
  perform public.admin_record_payment(o.id, o.total, 'TEST-EFT-' || o.ref, 'Test data', 'verified');
end $$;

-- Every order in the pool confirmed and paid, then funding finalised
create function pg_temp.fund(_pool uuid) returns void language plpgsql as $$
declare o record;
begin
  for o in select id, user_id from public.orders where pool_id = _pool and status = 'awaiting_confirmation' loop
    perform pg_temp.act_as(o.user_id);
    perform public.confirm_order(o.id, true);
  end loop;
  perform pg_temp.act_as(pg_temp.admin());
  for o in select id, total, ref from public.orders where pool_id = _pool and status = 'confirmed' loop
    perform public.admin_record_payment(o.id, o.total, 'TEST-EFT-' || o.ref, 'Test data', 'verified');
  end loop;
  perform public.admin_finalise_funding(_pool);
end $$;

-- ===== Admin, campaign and shops =====
do $$
declare admin_id uuid;
begin
  if exists (select 1 from auth.users where raw_app_meta_data ->> 'test_data' = 'true') then
    raise exception 'Test data is already loaded. Run clear.sql first (npm run test-data does both).';
  end if;
  select user_id into admin_id from public.user_roles where role = 'admin' limit 1;
  if admin_id is null then
    raise exception 'Make an admin first (README, "Admin accounts"): the test data acts as one.';
  end if;
  perform set_config('kasipool.test_admin', admin_id::text, false);
end $$;

insert into public.campaigns (id, name, description)
values ('7e57da7a-0000-4000-8000-000000000001', 'Test data',
  'Pools made by supabase/test-data/load.sql. Safe to delete with npm run test-data:clear.');

do $$
begin
  perform pg_temp.make_shop(1, 'Thandeka''s Spaza (test)', 'Thandeka Mbeki', 'Spaza / general dealer',
    'Khayelitsha', '12 Ntlazane Road, Site C, Khayelitsha', -34.0310, 18.6620);
  perform pg_temp.make_shop(2, 'Lwazi Car Wash (test)', 'Lwazi Ndlovu', 'Car wash',
    'Khayelitsha', 'Corner of Govan Mbeki and Oscar Mpetha Road, Harare', -34.0560, 18.6680);
  perform pg_temp.make_shop(3, 'Nomsa''s Hair Salon (test)', 'Nomsa Dube', 'Hair & beauty salon',
    'Gugulethu', 'NY 1, next to the taxi rank, Gugulethu', -33.9800, 18.5700);
  perform pg_temp.make_shop(4, 'Langa Fresh Bakery (test)', 'Sipho Mahlangu', 'Bakery',
    'Langa', 'Washington Street, Langa', -33.9440, 18.5290);
  perform pg_temp.make_shop(5, 'Rocklands Mini Market (test)', 'Fatima Isaacs', 'Spaza / general dealer',
    'Mitchells Plain', 'AZ Berman Drive, Rocklands, Mitchells Plain', -34.0480, 18.6160);
  perform pg_temp.make_shop(6, 'Philippi Kota King (test)', 'Bongani Zulu', 'Takeaway / food vendor',
    'Philippi', 'Lansdowne Road, Philippi', -34.0100, 18.5900);
  perform pg_temp.make_shop(7, 'Mbekweni Corner Shop (test)', 'Ayanda Khumalo', 'Spaza / general dealer',
    'Mbekweni', 'Main Road, Mbekweni, Paarl', -33.6990, 18.9900);
end $$;

-- ===== One pool per stage =====
do $$
declare pid uuid;
begin
  -- 1. Open, almost full: shop 1 joining with 4 or more fills it and it closes
  pid := pg_temp.make_pool('KP-MAI-10', 105, 90, 30, 20);
  perform pg_temp.join(2, pid, 8); perform pg_temp.join(3, pid, 8);
  perform pg_temp.join(4, pid, 6); perform pg_temp.join(5, pid, 4);

  -- 2. Open, just started: join, change the amount, leave
  pid := pg_temp.make_pool('KP-RIC-10', 189, 165, 60, 20);
  perform pg_temp.join(3, pid, 5); perform pg_temp.join(5, pid, 5);

  -- 3. Full, waiting for shops: shop 1 must confirm, shop 2 confirmed but not paid, 3 and 4 paid
  pid := pg_temp.make_pool('KP-SUG-10', 235, 205, 30, 15);
  perform pg_temp.join(1, pid, 10); perform pg_temp.join(2, pid, 8);
  perform pg_temp.join(3, pid, 7); perform pg_temp.join(4, pid, 5);
  perform pg_temp.confirm(2, pid);
  perform pg_temp.pay(3, pid); perform pg_temp.pay(4, pid);

  -- 4. Paid: admin authorises the supplier order
  pid := pg_temp.make_pool('KP-OIL-2L6', 345, 300, 20, 10);
  perform pg_temp.join(1, pid, 5); perform pg_temp.join(2, pid, 5);
  perform pg_temp.join(3, pid, 5); perform pg_temp.join(5, pid, 5);
  perform pg_temp.fund(pid);

  -- 5. Ordered from the supplier: admin records what arrived (try fewer, to see refunds)
  pid := pg_temp.make_pool('KP-FLR-10', 165, 145, 20, 10);
  perform pg_temp.join(1, pid, 6); perform pg_temp.join(4, pid, 8); perform pg_temp.join(6, pid, 6);
  perform pg_temp.fund(pid);
  perform pg_temp.act_as(pg_temp.admin());
  perform public.admin_create_po(pid, 'TEST-PO-FLOUR', current_date, current_date + 3);

  -- 6. Stock received: admin sends it out for delivery
  pid := pg_temp.make_pool('KP-BEV-2L6', 150, 130, 30, 10);
  perform pg_temp.join(1, pid, 10); perform pg_temp.join(2, pid, 10); perform pg_temp.join(6, pid, 10);
  perform pg_temp.fund(pid);
  perform pg_temp.act_as(pg_temp.admin());
  perform public.admin_create_po(pid, 'TEST-PO-COKE', current_date, current_date + 2);
  perform public.admin_receive_stock(pid, 30, null);

  -- 7. Out for delivery: shop 1 confirms or reports a problem; shop 2 marked delivered by the
  --    courier; shop 3 already confirmed
  pid := pg_temp.make_pool('KP-DSH-750', 360, 315, 10, 5);
  perform pg_temp.join(1, pid, 3); perform pg_temp.join(2, pid, 3); perform pg_temp.join(3, pid, 4);
  perform pg_temp.fund(pid);
  perform pg_temp.act_as(pg_temp.admin());
  perform public.admin_create_po(pid, 'TEST-PO-SUNLIGHT', current_date, current_date + 2);
  perform public.admin_receive_stock(pid, 10, null);
  perform public.admin_dispatch_pool(pid, 'TEST-COURIER-1');
  perform public.admin_mark_delivered(pg_temp.order_of(2, pid), 'Test data');
  perform pg_temp.act_as(pg_temp.shop(3));
  perform public.confirm_delivery_received(pg_temp.order_of(3, pid));

  -- 8. Done: everyone got their stock
  pid := pg_temp.make_pool('KP-SAL-1', 130, 110, 10, 10);
  perform pg_temp.join(1, pid, 4); perform pg_temp.join(5, pid, 6);
  perform pg_temp.fund(pid);
  perform pg_temp.act_as(pg_temp.admin());
  perform public.admin_create_po(pid, 'TEST-PO-SALT', current_date, current_date + 2);
  perform public.admin_receive_stock(pid, 10, null);
  perform public.admin_dispatch_pool(pid, 'TEST-COURIER-2');
  perform pg_temp.act_as(pg_temp.shop(1));
  perform public.confirm_delivery_received(pg_temp.order_of(1, pid));
  perform pg_temp.act_as(pg_temp.shop(5));
  perform public.confirm_delivery_received(pg_temp.order_of(5, pid));

  -- 9. Failed after paying: shop 6 did not pay and the closing time passed, so shops 1 and 4
  --    are owed refunds
  pid := pg_temp.make_pool('KP-BRD-125', 190, 165, 20, 10);
  perform pg_temp.join(1, pid, 6); perform pg_temp.join(4, pid, 6); perform pg_temp.join(6, pid, 8);
  perform pg_temp.pay(1, pid); perform pg_temp.pay(4, pid);
  update public.pools set closes_at = now() - interval '1 minute' where id = pid;
  perform pg_temp.act_as(pg_temp.admin());
  perform public.admin_skip_ahead(pid);

  -- 10. Reopened: shop 5 did not pay, so the deal is open again for 8 more
  pid := pg_temp.make_pool('KP-YST-500', 95, 80, 20, 10);
  perform pg_temp.join(1, pid, 6); perform pg_temp.join(3, pid, 6); perform pg_temp.join(5, pid, 8);
  perform pg_temp.pay(1, pid); perform pg_temp.pay(3, pid);
  perform pg_temp.act_as(pg_temp.admin());
  perform public.admin_skip_ahead(pid);

  -- 11. Private group asked for by shop 2: others join with code CARWASH1
  perform pg_temp.act_as(pg_temp.shop(2));
  pid := public.propose_pool((select id from public.products where sku = 'KP-CAR-5L4'), 'box', 6,
    null, 1, 3, now(), now() + interval '7 days', 'Car washes in Khayelitsha buying together', true);
  update public.pools set campaign_id = '7e57da7a-0000-4000-8000-000000000001',
      supplier_id = 'ca5e0000-0000-4000-8000-000000000001', reference_price = 520,
      reference_source = 'Estimated cash & carry price, October 2026', invite_code = 'CARWASH1'
    where id = pid;
  insert into public.pool_costs (pool_id, supplier_cost) values (pid, 440);
  perform pg_temp.act_as(pg_temp.admin());
  perform public.admin_publish_pool(pid);
  perform pg_temp.join(2, pid, 2);

  -- 12. Asked for by shop 3, waiting for an admin to check prices and publish
  perform pg_temp.act_as(pg_temp.shop(3));
  perform public.propose_pool((select id from public.products where sku = 'KP-RLX-6'), 'box', 10,
    null, 1, 4, now(), now() + interval '10 days', 'Salons in Gugulethu and Nyanga', false);

  -- 13. Opens tomorrow: admin can open it now with "Skip ahead"
  pid := pg_temp.make_pool('KP-BEV-2L6', 150, 130, 40, 10, interval '1 day');
end $$;

reset request.jwt.claims;

-- ===== What was made =====
select pr.name as product, p.status, p.pledged_qty || '/' || p.min_qty as joined,
  p.paid_qty as paid, coalesce(p.invite_code, '') as code
from public.pools p join public.products pr on pr.id = p.product_id
where p.campaign_id = '7e57da7a-0000-4000-8000-000000000001'
   or p.proposed_by in (select id from auth.users where raw_app_meta_data ->> 'test_data' = 'true')
order by array_position(array['draft', 'scheduled', 'open', 'awaiting_confirmation', 'funded',
  'procurement', 'stock_received', 'out_for_delivery', 'completed', 'refund_resolution'], p.status),
  pr.name;

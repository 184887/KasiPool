begin;
select plan(13);

update public.app_settings set value = '{"fee_per_order": 0}' where key = 'delivery';

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c001', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c002', 'b@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c003', 'c@test.local', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000ad01', 'admin');

-- Signing up
select throws_ok(
  $$insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address)
    values ('00000000-0000-0000-0000-00000000c003', 'X', 'X', '+27600000059', 'Langa', 'Cape Town', 'Western Cape', '1 X Rd')$$,
  '23514', null, 'a business needs its area or a map pin');
select lives_ok(
  $$insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address,
      approx_latitude, approx_longitude)
    values ('00000000-0000-0000-0000-00000000c001', 'A', 'A', '+27600000051', 'Khayelitsha', 'Cape Town',
      'Western Cape', 'Opposite the Site C taxi rank', -34.0300, 18.6600)$$,
  'a business can sign up with only its area (no map pin yet)');
insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address,
    latitude, longitude)
  values ('00000000-0000-0000-0000-00000000c002', 'B', 'B', '+27600000052', 'Khayelitsha', 'Cape Town',
    'Western Cape', '2 Spine Rd', -34.0116, 18.6458);
select throws_ok(
  $$update public.businesses set deliver_to = 'other', delivery_address = 'My cousin''s shop'
    where user_id = '00000000-0000-0000-0000-00000000c002'$$,
  '23514', null, 'a second address also needs its area or a pin');
select lives_ok(
  $$update public.businesses set deliver_to = 'other', delivery_address = 'My cousin''s shop',
      delivery_area = 'Harare', delivery_approx_latitude = -34.0560, delivery_approx_longitude = 18.6680
    where user_id = '00000000-0000-0000-0000-00000000c002'$$,
  'a second address can start with only its area');

-- A deal near Khayelitsha
insert into public.suppliers (id, name) values ('00000000-0000-0000-0000-0000000005e1', 'Supplier');
insert into public.products (id, sku, name) values ('00000000-0000-0000-0000-00000000f001', 'T-1', 'Rice 10kg');
insert into public.pools (id, product_id, supplier_id, unit, reference_price, min_qty, closes_at)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000f001',
  '00000000-0000-0000-0000-0000000005e1', 'bag', 100, 10, now() + interval '7 days');
insert into public.pool_costs (pool_id, supplier_cost) values ('00000000-0000-0000-0000-0000000000b1', 80);
insert into public.pool_locations (pool_id, latitude, longitude) values ('00000000-0000-0000-0000-0000000000b1', -34.0116, 18.6458);
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b1');

-- Shop A (area only) sees the distance and joins; shop B (second address, area only) fills it
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select is((select in_range from public.my_pool_distances() where pool_id = '00000000-0000-0000-0000-0000000000b1'),
  true, 'distances work from the area alone');
select lives_ok($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 6)$$,
  'a shop without a map pin can join');
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select public.join_pool('00000000-0000-0000-0000-0000000000b1', 4);
select ok(exists(select 1 from public.notifications where user_id = '00000000-0000-0000-0000-00000000c001'
  and title = 'The pool is full: please confirm' and body like '%set your map pin%'),
  'when the pool fills, a shop without a pin is told to set it');

-- Confirming needs the exact pin
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select throws_like($$select public.confirm_order((select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'), true, 'cash')$$,
  '%Set your map pin first%', 'a shop can''t confirm without its map pin');
update public.businesses set latitude = -33.70, longitude = 18.99 where user_id = '00000000-0000-0000-0000-00000000c001';
select throws_like($$select public.confirm_order((select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'), true, 'cash')$$,
  '%only for businesses within 10 km%', 'the exact pin is checked against the deal''s distance');
update public.businesses set latitude = -34.0310, longitude = 18.6620 where user_id = '00000000-0000-0000-0000-00000000c001';
select lives_ok($$select public.confirm_order((select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'), true, 'cash')$$,
  'with its pin set, the shop confirms');
select results_eq($$select delivery_latitude, delivery_longitude from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'$$,
  $$values (-34.0310::float8, 18.6620::float8)$$, 'the order is delivered to the exact pin');

-- Shop B: its second address needs its own pin
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select throws_like($$select public.confirm_order((select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c002'), true, 'eft')$$,
  '%Set your map pin first%', 'the business pin is not enough when stock goes to the second address');
update public.businesses set delivery_latitude = -34.0200, delivery_longitude = 18.6500 where user_id = '00000000-0000-0000-0000-00000000c002';
select lives_ok($$select public.confirm_order((select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c002'), true, 'eft')$$,
  'with the second address pinned, the shop confirms');

select * from finish();
rollback;

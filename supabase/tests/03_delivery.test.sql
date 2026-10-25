begin;
select plan(25);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- One flat delivery fee of R50 per order (it is R0 by default)
update public.app_settings set value = '{"fee_per_order": 50}' where key = 'delivery';
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c001', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c002', 'b@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c003', 'c@test.local', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000ad01', 'admin');
-- The deal is centred on Site C, Khayelitsha. Shop A is there. Shop B's business is in Bellville
-- (12 km away) but its stock goes to a second address 1 km from Site C. Shop C is in Bellville.
insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address,
    latitude, longitude, deliver_to, delivery_address, delivery_latitude, delivery_longitude) values
  ('00000000-0000-0000-0000-00000000c001', 'A', 'A', '+27600000011', 'Khayelitsha', 'Cape Town', 'Western Cape',
    '1 Main Rd', -34.0116, 18.6458, 'business', null, null, null),
  ('00000000-0000-0000-0000-00000000c002', 'B', 'B', '+27600000012', 'Bellville', 'Cape Town', 'Western Cape',
    '2 Voortrekker Rd', -33.9022, 18.6292, 'other', '9 Spine Rd', -34.02, 18.65),
  ('00000000-0000-0000-0000-00000000c003', 'C', 'C', '+27600000013', 'Bellville', 'Cape Town', 'Western Cape',
    '3 Durban Rd', -33.9022, 18.6292, 'business', null, null, null);

select throws_ok(
  $$insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address)
    values ('00000000-0000-0000-0000-00000000ad01', 'X', 'X', '+27600000019', 'X', 'Cape Town', 'Western Cape', '1 X Rd')$$,
  '23514', null, 'a business needs a map pin'
);
select throws_ok(
  $$update public.businesses set deliver_to = 'other', delivery_address = '5 Y Rd'
    where user_id = '00000000-0000-0000-0000-00000000c001'$$,
  '23514', null, 'a second delivery address needs its own map pin'
);

insert into public.suppliers (id, name) values ('00000000-0000-0000-0000-0000000005e1', 'Supplier');
insert into public.products (id, sku, name) values ('00000000-0000-0000-0000-00000000f001', 'T-1', 'Rice 10kg');
insert into public.pools (id, product_id, supplier_id, unit, reference_price, min_qty, closes_at)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000f001',
  '00000000-0000-0000-0000-0000000005e1', 'bag', 250, 10, now() + interval '7 days');
insert into public.pool_costs (pool_id, supplier_cost) values ('00000000-0000-0000-0000-0000000000b1', 200);

select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select throws_like($$select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b1')$$,
  '%centred%', 'publishing needs a centre');
select lives_ok($$select public.admin_set_pool_location('00000000-0000-0000-0000-0000000000b1',
  -34.0116, 18.6458, 10, 'Site C')$$, 'admin sets the centre and a 10 km radius');
select lives_ok($$select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b1')$$, 'publishes with a centre');

-- Joining checks the distance to where the stock goes
select pg_temp.act_as('00000000-0000-0000-0000-00000000c003');
select throws_like($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 4)$$,
  '%only for businesses within 10 km. You are 12 km away.%', 'a business 12 km away can''t join');
select results_eq($$select distance_km, in_range from public.my_pool_distances()
  where pool_id = '00000000-0000-0000-0000-0000000000b1'$$,
  $$values (12, false)$$, 'it sees the rounded distance and that it is too far');
set local role authenticated;
select is((select count(*)::int from public.pool_locations), 0, 'shops can''t read where pools are centred');
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select lives_ok($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 6)$$, 'shop A joins');
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select lives_ok($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 4)$$,
  'shop B joins through its second address, 1 km away');

-- Target reached: the pool closes and orders carry the delivery address and fee
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b1'),
  'awaiting_confirmation', 'the pool closes when the target is reached');
select results_eq(
  $$select delivery_address, delivery_fee, total from public.orders
    where pool_id = '00000000-0000-0000-0000-0000000000b1' order by quantity$$,
  $$values ('9 Spine Rd'::text, 50.00::numeric(12,2), 890.00::numeric(12,2)),
           ('1 Main Rd'::text, 50.00::numeric(12,2), 1310.00::numeric(12,2))$$,
  'orders are 210 x qty plus the R50 fee, delivered to the right address'
);

-- Both confirm and pay; funding goes through
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.confirm_order((select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'), true);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select public.confirm_order((select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c002'), true);
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_record_payment(id, total, 'EFT', null, 'verified') from public.orders
  where pool_id = '00000000-0000-0000-0000-0000000000b1';
select is(public.admin_finalise_funding('00000000-0000-0000-0000-0000000000b1'), 'funded', 'pool is funded');
select public.admin_create_po('00000000-0000-0000-0000-0000000000b1', 'PO-1', current_date, null);

-- Supplier delivers 7 of 10: A (paid first) gets 6, B gets 1 and a refund for 3 bags
select public.admin_receive_stock('00000000-0000-0000-0000-0000000000b1', 7, 'short');
select is((select amount from public.refunds r join public.orders o on o.id = r.order_id
  where o.user_id = '00000000-0000-0000-0000-00000000c002'), 630.00::numeric(12,2),
  'short delivery refunds the missing goods (3 x 210)');

-- Dispatch and deliver
select is(public.admin_dispatch_pool('00000000-0000-0000-0000-0000000000b1', 'CR-77'), 2, 'two orders go out');
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b1'),
  'out_for_delivery', 'pool is out for delivery');
select public.admin_mark_delivered(
  (select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'), 'courier POD');
select is((select fulfilment_status from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'),
  'delivered', 'admin records the courier''s delivery');

-- Shop B confirms directly (the courier hasn't reported yet), then reports a problem
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select lives_ok($$select public.confirm_delivery_received(
  (select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c002'))$$,
  'a shop can confirm receipt while out for delivery');
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b1'),
  'completed', 'the pool completes when nothing is still out for delivery');
select lives_ok($$select public.report_delivery_problem(
  (select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c002'), 'One bag torn')$$,
  'a shop can report a problem');
select is((select count(*)::int from public.notifications
  where user_id = '00000000-0000-0000-0000-00000000ad01' and title = 'Delivery problem'), 1,
  'admins are notified about the problem');
select throws_like($$select public.confirm_delivery_received(
  (select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'))$$,
  '%not on the way yet%', 'a shop can''t confirm someone else''s order');

-- Shop A confirms its delivered order
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select lives_ok($$select public.confirm_delivery_received(
  (select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'))$$,
  'shop A confirms receipt');

-- A business asking for a deal becomes its hub
select pg_temp.act_as('00000000-0000-0000-0000-00000000c003');
select public.propose_pool('00000000-0000-0000-0000-00000000f001', 'bag', 20, null, 1, null,
  now(), now() + interval '7 days', null, false);
select results_eq($$select l.latitude, l.longitude, l.radius_km from public.pool_locations l
  join public.pools p on p.id = l.pool_id where p.proposed_by = '00000000-0000-0000-0000-00000000c003'$$,
  $$values (-33.9022::float8, 18.6292::float8, 10.0::numeric(5,1))$$,
  'a requested deal is centred on the business that asked, with a 10 km radius');

-- Internal helpers aren't callable through the API
select ok(not has_function_privilege('authenticated', 'public.set_order_delivery(uuid)', 'execute'),
  'set_order_delivery is internal');

select * from finish();
rollback;

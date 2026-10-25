begin;
select plan(20);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- Zones: Khayelitsha (R50) and Gugulethu (R40); the deal only delivers to Khayelitsha
insert into public.delivery_zones (id, name, delivery_fee) values
  ('00000000-0000-0000-0000-0000000000e1', 'Khayelitsha', 50),
  ('00000000-0000-0000-0000-0000000000e2', 'Gugulethu', 40);
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c001', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c002', 'b@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c003', 'c@test.local', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000ad01', 'admin');
-- Shop A: business address in Khayelitsha. Shop B: business in Gugulethu but delivers to a
-- second address in Khayelitsha. Shop C: Gugulethu only.
insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address, zone_id,
    deliver_to, delivery_address, delivery_zone_id) values
  ('00000000-0000-0000-0000-00000000c001', 'A', 'A', '+27600000011', 'Khayelitsha', 'Cape Town', 'Western Cape',
    '1 Main Rd', '00000000-0000-0000-0000-0000000000e1', 'business', null, null),
  ('00000000-0000-0000-0000-00000000c002', 'B', 'B', '+27600000012', 'Gugulethu', 'Cape Town', 'Western Cape',
    '2 NY1', '00000000-0000-0000-0000-0000000000e2', 'other', '9 Spine Rd', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000c003', 'C', 'C', '+27600000013', 'Gugulethu', 'Cape Town', 'Western Cape',
    '3 NY5', '00000000-0000-0000-0000-0000000000e2', 'business', null, null);

select throws_ok(
  $$insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province)
    values ('00000000-0000-0000-0000-00000000ad01', 'X', 'X', '+27600000019', 'X', 'Cape Town', 'Western Cape')$$,
  '23514', null, 'a business needs an address and delivery zone'
);

insert into public.suppliers (id, name) values ('00000000-0000-0000-0000-0000000005e1', 'Supplier');
insert into public.products (id, sku, name) values ('00000000-0000-0000-0000-00000000f001', 'T-1', 'Rice 10kg');
insert into public.pools (id, product_id, supplier_id, unit, reference_price, min_qty, closes_at)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000f001',
  '00000000-0000-0000-0000-0000000005e1', 'bag', 250, 10, now() + interval '7 days');
insert into public.pool_costs (pool_id, supplier_cost) values ('00000000-0000-0000-0000-0000000000b1', 200);

select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select throws_like($$select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b1')$$,
  '%delivery zone%', 'publishing needs a delivery zone');
insert into public.pool_zones (pool_id, zone_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1');
select lives_ok($$select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b1')$$, 'publishes with a zone');

-- Joining checks the delivery zone
select pg_temp.act_as('00000000-0000-0000-0000-00000000c003');
select throws_like($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 4)$$,
  '%doesn''t deliver to Gugulethu%', 'a shop outside the zones can''t join');
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select lives_ok($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 6)$$, 'shop A joins');
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select lives_ok($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 4)$$,
  'shop B joins through its second address');

-- Target reached: the pool closes and orders carry the delivery address and fee
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b1'),
  'awaiting_confirmation', 'the pool closes when the target is reached');
select results_eq(
  $$select delivery_address, delivery_fee, total from public.orders
    where pool_id = '00000000-0000-0000-0000-0000000000b1' order by quantity$$,
  $$values ('9 Spine Rd'::text, 50.00::numeric(12,2), 890.00::numeric(12,2)),
           ('1 Main Rd'::text, 50.00::numeric(12,2), 1310.00::numeric(12,2))$$,
  'orders are 210 x qty plus the R50 Khayelitsha fee, delivered to the right address'
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
  '%not out for delivery%', 'a shop can''t confirm someone else''s order');

-- Shop A confirms its delivered order
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select lives_ok($$select public.confirm_delivery_received(
  (select id from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'))$$,
  'shop A confirms receipt');

-- Internal helpers aren't callable through the API
select ok(not has_function_privilege('authenticated', 'public.set_order_delivery(uuid)', 'execute'),
  'set_order_delivery is internal');

select * from finish();
rollback;

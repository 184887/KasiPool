begin;
select plan(13);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c001', 'real@test.local', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000ad01', 'admin');
-- A real shop on the Cape Flats, inside the test pools' radius
insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address, latitude, longitude)
values ('00000000-0000-0000-0000-00000000c001', 'Real Shop', 'Rep', '+27600000091', 'Nyanga', 'Cape Town',
  'Western Cape', '1 Rd', -33.9930, 18.5850);
-- A real open deal near the test shops
insert into public.pools (id, product_id, supplier_id, unit, reference_price, min_qty, closes_at)
values ('00000000-0000-0000-0000-0000000000b1', (select id from public.products where sku = 'KP-SAL-1'),
  'ca5e0000-0000-4000-8000-000000000001', 'bale', 130, 50, now() + interval '7 days');
insert into public.pool_costs (pool_id, supplier_cost) values ('00000000-0000-0000-0000-0000000000b1', 110);
insert into public.pool_locations (pool_id, latitude, longitude) values ('00000000-0000-0000-0000-0000000000b1', -34.0, 18.6);

select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select throws_like($$select public.admin_reset_test_data()$$, '%Not authorised%', 'shops can''t reset test data');

select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b1');
select is(public.admin_reset_test_data(), 'Loaded 7 test shops and 13 test pools', 'an admin resets the test data');
select is((select count(*)::int from public.pools where is_test), 13, 'every test pool is flagged');
select is((select count(*)::int from public.businesses where is_test), 7, 'every test shop is flagged');

-- A real shop
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
set local role authenticated;
select is((select count(*)::int from public.pools where is_test), 0, 'real shops don''t see test pools');
reset role;
select throws_like($$select public.join_pool((select id from public.pools where is_test and status = 'open'
  and not is_private limit 1), 2)$$, '%Deal not found%', 'real shops can''t join a test pool');
select throws_like($$select public.claim_pool_invite('CARWASH1')$$, '%can''t find this code%',
  'real shops can''t use a test group code');
select is((select count(*)::int from public.my_pool_distances() d join public.pools p on p.id = d.pool_id
  where p.is_test), 0, 'real shops get no distances to test pools');
set local role authenticated;
update public.businesses set is_test = true where user_id = '00000000-0000-0000-0000-00000000c001';
reset role;
select ok(not (select is_test from public.businesses where user_id = '00000000-0000-0000-0000-00000000c001'),
  'shops can''t mark themselves as test shops');

-- A test shop
select pg_temp.act_as((select id from auth.users where email = '27600000006@phone.kasipool.co.za'));
set local role authenticated;
select ok((select count(*)::int from public.pools where not is_test and status = 'open') > 0,
  'test shops see the real deals');
reset role;
select throws_like($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 2)$$,
  '%Test shops can only join test pools%', 'test shops can''t join a real deal');
create temp table asked as select public.propose_pool((select id from public.products where sku = 'KP-SAL-1'),
  'bale', 10, null, 1, null, now(), now() + interval '5 days', null, false) as id;
select ok((select is_test from public.pools where id = (select id from asked)),
  'a test shop''s request is a test pool');

select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select is(public.admin_reset_test_data(false), 'Removed 7 test shops and 14 test pools',
  'removing the test data leaves no test shops or pools');

select * from finish();
rollback;

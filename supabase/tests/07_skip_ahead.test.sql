begin;
select plan(9);

update public.app_settings set value = '{"fee_per_order": 0}' where key = 'delivery';

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c001', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c002', 'b@test.local', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000ad01', 'admin');
insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address, latitude, longitude, is_test)
select u, 'Shop', 'Rep', '+2760000003' || right(u::text, 1), 'Town', 'Cape Town', 'Western Cape', '1 Rd',
  -34.0116, 18.6458, true
from unnest(array['00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000c002']::uuid[]) u;
insert into public.suppliers (id, name) values ('00000000-0000-0000-0000-0000000005e1', 'Supplier');
insert into public.products (id, sku, name) values ('00000000-0000-0000-0000-00000000f001', 'T-1', 'Oil 5L');

-- Test pools: b1 opens tomorrow, b2 is open now. b3 is a real deal. All need 10 and close in a week.
insert into public.pools (id, product_id, supplier_id, unit, reference_price, min_qty, opens_at, closes_at, is_test)
values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000f001',
   '00000000-0000-0000-0000-0000000005e1', 'case', 100, 10, now() + interval '1 day', now() + interval '7 days', true),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000f001',
   '00000000-0000-0000-0000-0000000005e1', 'case', 100, 10, now(), now() + interval '7 days', true),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-00000000f001',
   '00000000-0000-0000-0000-0000000005e1', 'case', 100, 10, now() + interval '1 day', now() + interval '7 days', false);
insert into public.pool_costs (pool_id, supplier_cost)
  values ('00000000-0000-0000-0000-0000000000b1', 80), ('00000000-0000-0000-0000-0000000000b2', 80),
         ('00000000-0000-0000-0000-0000000000b3', 80);
insert into public.pool_locations (pool_id, latitude, longitude)
  values ('00000000-0000-0000-0000-0000000000b1', -34.0116, 18.6458),
         ('00000000-0000-0000-0000-0000000000b2', -34.0116, 18.6458),
         ('00000000-0000-0000-0000-0000000000b3', -34.0116, 18.6458);
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b1');
select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b2');
select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b3');

select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select throws_like($$select public.admin_skip_ahead('00000000-0000-0000-0000-0000000000b1')$$,
  '%Not authorised%', 'shops can''t skip ahead');

select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select throws_like($$select public.admin_skip_ahead('00000000-0000-0000-0000-0000000000b3')$$,
  '%only works on test pools%', 'real deals can''t skip ahead');
select is(public.admin_skip_ahead('00000000-0000-0000-0000-0000000000b1'), 'opened', 'a scheduled pool opens');
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b1'), 'open',
  'the pool is open now');
select throws_like($$select public.admin_skip_ahead('00000000-0000-0000-0000-0000000000b1')$$,
  '%Only scheduled pools and pools waiting for shops to confirm%', 'an open pool can''t skip ahead');

-- b2: A (6) and B (4) fill it; only A confirms
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.join_pool('00000000-0000-0000-0000-0000000000b2', 6);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select public.join_pool('00000000-0000-0000-0000-0000000000b2', 4);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.confirm_order((select id from public.orders where pool_id = '00000000-0000-0000-0000-0000000000b2'
  and user_id = '00000000-0000-0000-0000-00000000c001'), true, 'eft');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');

select is(public.admin_skip_ahead('00000000-0000-0000-0000-0000000000b2'), 'reopened',
  'ending the confirm time early reopens a short pool before its closing time');
select is((select status from public.orders where pool_id = '00000000-0000-0000-0000-0000000000b2'
  and user_id = '00000000-0000-0000-0000-00000000c002'), 'expired', 'the unconfirmed order closes');

-- Nobody fills the gap before the closing time
update public.pools set closes_at = now() - interval '1 second' where id = '00000000-0000-0000-0000-0000000000b2';
select public.refresh_pool_states();
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b2'),
  'unsuccessful', 'past the closing time the short pool fails; nobody paid, so no refunds');
select ok(exists(select 1 from public.audit_events where action = 'skip_ahead'
  and entity_id = '00000000-0000-0000-0000-0000000000b2'), 'skipping ahead is audited');

select * from finish();
rollback;

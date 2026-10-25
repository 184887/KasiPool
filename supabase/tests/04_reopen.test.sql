begin;
select plan(15);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
-- Pretend the payment deadline has passed, then run the timer
create function pg_temp.deadline_passes(_pool uuid) returns void language sql as $$
  update public.pools set payment_deadline = now() - interval '1 second' where id = _pool;
  select public.refresh_pool_states();
$$;

insert into public.delivery_zones (id, name, delivery_fee) values ('00000000-0000-0000-0000-0000000000e1', 'Test zone', 0);
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c001', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c002', 'b@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c003', 'c@test.local', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000ad01', 'admin');
insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address, zone_id)
select u, 'Shop', 'Rep', '+2760000002' || right(u::text, 1), 'Town', 'Cape Town', 'Western Cape', '1 Rd',
  '00000000-0000-0000-0000-0000000000e1'
from unnest(array['00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-00000000c003']::uuid[]) u;
insert into public.suppliers (id, name) values ('00000000-0000-0000-0000-0000000005e1', 'Supplier');
insert into public.products (id, sku, name) values ('00000000-0000-0000-0000-00000000f001', 'T-1', 'Oil 5L');

-- Two published pools, target 10, closing in a week
insert into public.pools (id, product_id, supplier_id, unit, reference_price, min_qty, closes_at)
select id, '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000005e1', 'case', 100, 10,
  now() + interval '7 days'
from unnest(array['00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2']::uuid[]) id;
insert into public.pool_costs (pool_id, supplier_cost)
  values ('00000000-0000-0000-0000-0000000000b1', 80), ('00000000-0000-0000-0000-0000000000b2', 80);
insert into public.pool_zones (pool_id, zone_id)
  values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1'),
         ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000e1');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b1');
select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b2');

-- Pool 1: A (6) and B (4) reach the target; only A pays
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.join_pool('00000000-0000-0000-0000-0000000000b1', 6);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select public.join_pool('00000000-0000-0000-0000-0000000000b1', 4);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.confirm_order((select id from public.orders where pool_id = '00000000-0000-0000-0000-0000000000b1'
  and user_id = '00000000-0000-0000-0000-00000000c001'), true);
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_record_payment(id, total, 'EFT', null, 'verified') from public.orders
  where pool_id = '00000000-0000-0000-0000-0000000000b1' and user_id = '00000000-0000-0000-0000-00000000c001';
select throws_like($$select public.admin_finalise_funding('00000000-0000-0000-0000-0000000000b1')$$,
  '%below the minimum%', 'admin can''t finalise early while short');

select pg_temp.deadline_passes('00000000-0000-0000-0000-0000000000b1');
select results_eq(
  $$select status, pledged_qty, paid_qty, payment_deadline is null, reopened_at is not null
    from public.pools where id = '00000000-0000-0000-0000-0000000000b1'$$,
  $$values ('open'::text, 6, 6, true, true)$$,
  'after the deadline the pool reopens with the paid quantity counted'
);
select is((select status from public.orders where user_id = '00000000-0000-0000-0000-00000000c002'
  and pool_id = '00000000-0000-0000-0000-0000000000b1'), 'expired', 'the unpaid order expires');
select is((select payment_status from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'
  and pool_id = '00000000-0000-0000-0000-0000000000b1'), 'paid', 'the paid order is kept');
select ok(exists(select 1 from public.notifications where user_id = '00000000-0000-0000-0000-00000000c001'
  and title = 'Deal reopened to fill the gap'), 'the paid shop is told about the reopen');

-- Who can join the reopened pool
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select throws_like($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 4)$$,
  '%wasn''t completed%', 'a shop whose order expired can''t rejoin');
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select throws_like($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 2)$$,
  '%already have an order%', 'a shop that paid can''t join twice');
select pg_temp.act_as('00000000-0000-0000-0000-00000000c003');
select lives_ok($$select public.join_pool('00000000-0000-0000-0000-0000000000b1', 4)$$, 'a new shop fills the gap');
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b1'),
  'awaiting_confirmation', 'filling the gap closes the pool again');
select is((select count(*)::int from public.orders where pool_id = '00000000-0000-0000-0000-0000000000b1'
  and status = 'awaiting_confirmation'), 1, 'only the new shop gets a new order to confirm');

select public.confirm_order((select id from public.orders where pool_id = '00000000-0000-0000-0000-0000000000b1'
  and user_id = '00000000-0000-0000-0000-00000000c003'), true);
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_record_payment(id, total, 'EFT', null, 'verified') from public.orders
  where pool_id = '00000000-0000-0000-0000-0000000000b1' and user_id = '00000000-0000-0000-0000-00000000c003';
select is(public.admin_finalise_funding('00000000-0000-0000-0000-0000000000b1'), 'funded',
  'paid quantity from both rounds funds the pool');

-- Pool 2: reopened, but nobody fills the gap before the closing time
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.join_pool('00000000-0000-0000-0000-0000000000b2', 6);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select public.join_pool('00000000-0000-0000-0000-0000000000b2', 4);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.confirm_order((select id from public.orders where pool_id = '00000000-0000-0000-0000-0000000000b2'
  and user_id = '00000000-0000-0000-0000-00000000c001'), true);
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_record_payment(id, total, 'EFT', null, 'verified') from public.orders
  where pool_id = '00000000-0000-0000-0000-0000000000b2' and user_id = '00000000-0000-0000-0000-00000000c001';
select pg_temp.deadline_passes('00000000-0000-0000-0000-0000000000b2');
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b2'), 'open', 'pool 2 reopens');

update public.pools set closes_at = now() - interval '1 second' where id = '00000000-0000-0000-0000-0000000000b2';
select public.refresh_pool_states();
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b2'),
  'refund_resolution', 'at the closing time the pool fails');
select results_eq(
  $$select o.status, r.amount from public.orders o join public.refunds r on r.order_id = o.id
    where o.pool_id = '00000000-0000-0000-0000-0000000000b2'$$,
  $$values ('failed'::text, 504.00::numeric(12,2))$$,
  'the shop that paid gets a full refund (6 x R84)'
);

-- A deadline that passes after the closing time fails straight away
update public.pools set status = 'awaiting_confirmation', payment_deadline = now() - interval '1 second'
  where id = '00000000-0000-0000-0000-0000000000b2';
select is(public.finalise_funding('00000000-0000-0000-0000-0000000000b2'), 'failed',
  'no reopen once the closing time has passed');

select * from finish();
rollback;

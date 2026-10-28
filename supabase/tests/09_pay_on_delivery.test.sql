begin;
select plan(23);

update public.app_settings set value = '{"fee_per_order": 0}' where key = 'delivery';

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.order_of(_user uuid, _pool uuid) returns uuid language sql as $$
  select id from public.orders where user_id = _user and pool_id = _pool
$$;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c001', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c002', 'b@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c003', 'c@test.local', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000ad01', 'admin');
insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address, latitude, longitude)
select u, 'Shop', 'Rep', '+2760000004' || right(u::text, 1), 'Town', 'Cape Town', 'Western Cape', '1 Rd',
  -34.0116, 18.6458
from unnest(array['00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-00000000c003']::uuid[]) u;
insert into public.suppliers (id, name) values ('00000000-0000-0000-0000-0000000005e1', 'Supplier');
insert into public.products (id, sku, name) values ('00000000-0000-0000-0000-00000000f001', 'T-1', 'Oil 5L');
insert into public.pools (id, product_id, supplier_id, unit, reference_price, min_qty, closes_at)
select id, '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000005e1', 'case', 100, 10,
  now() + interval '7 days'
from unnest(array['00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2']::uuid[]) id;
insert into public.pool_costs (pool_id, supplier_cost)
  values ('00000000-0000-0000-0000-0000000000b1', 80), ('00000000-0000-0000-0000-0000000000b2', 80);
insert into public.pool_locations (pool_id, latitude, longitude)
  values ('00000000-0000-0000-0000-0000000000b1', -34.0116, 18.6458),
         ('00000000-0000-0000-0000-0000000000b2', -34.0116, 18.6458);
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b1');
select public.admin_publish_pool('00000000-0000-0000-0000-0000000000b2');

-- Pool 1: A (6, cash) and B (4, EFT) fill it. Price is R84 a case.
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.join_pool('00000000-0000-0000-0000-0000000000b1', 6);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select public.join_pool('00000000-0000-0000-0000-0000000000b1', 4);

select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select throws_like($$select public.confirm_order(pg_temp.order_of('00000000-0000-0000-0000-00000000c001',
  '00000000-0000-0000-0000-0000000000b1'), true)$$, '%Choose how you will pay%', 'confirming needs a way to pay');
select public.confirm_order(pg_temp.order_of('00000000-0000-0000-0000-00000000c001',
  '00000000-0000-0000-0000-0000000000b1'), true, 'cash');
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select public.confirm_order(pg_temp.order_of('00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-0000000000b1'), true, 'eft');
select results_eq($$select payment_method, payment_status from public.orders
  where pool_id = '00000000-0000-0000-0000-0000000000b1' order by quantity$$,
  $$values ('eft'::text, 'awaiting_payment'::text), ('cash'::text, 'awaiting_payment'::text)$$,
  'each order keeps how the shop will pay');

select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select is(public.admin_finalise_funding('00000000-0000-0000-0000-0000000000b1'), 'funded',
  'confirmed orders fund the pool before anyone pays');
select public.admin_create_po('00000000-0000-0000-0000-0000000000b1', 'PO-1', current_date, null);
select is((select quantity from public.purchase_orders where pool_id = '00000000-0000-0000-0000-0000000000b1'),
  10, 'KasiPool orders stock for every confirmed order');

-- B uploads a proof of payment
select pg_temp.act_as('00000000-0000-0000-0000-00000000c003');
select throws_like($$select public.submit_payment_proof(pg_temp.order_of('00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-0000000000b1'), '00000000-0000-0000-0000-00000000c003/x.jpg')$$,
  '%Order not found%', 'a shop can''t send a proof for someone else''s order');
set local role authenticated;
select throws_ok($$insert into storage.objects (bucket_id, name)
  values ('payment-proofs', '00000000-0000-0000-0000-00000000c002/sneaky.jpg')$$,
  '42501', null, 'a shop can''t upload into another shop''s folder');
reset role;

select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
set local role authenticated;
select lives_ok($$insert into storage.objects (bucket_id, name)
  values ('payment-proofs', '00000000-0000-0000-0000-00000000c002/proof-1.jpg')$$,
  'a shop uploads into its own folder');
reset role;
select throws_like($$select public.submit_payment_proof(pg_temp.order_of('00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-0000000000b1'), '00000000-0000-0000-0000-00000000c002/missing.jpg')$$,
  '%upload your proof of payment again%', 'the file must have been uploaded');
select lives_ok($$select public.submit_payment_proof(pg_temp.order_of('00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-0000000000b1'), '00000000-0000-0000-0000-00000000c002/proof-1.jpg')$$,
  'the shop sends its proof');
select is((select payment_status from public.orders where user_id = '00000000-0000-0000-0000-00000000c002'),
  'under_review', 'a proof is not a payment: the order waits for a check');
select ok(exists(select 1 from public.notifications where user_id = '00000000-0000-0000-0000-00000000ad01'
  and title = 'Proof of payment to check'), 'admins are told to check it');
select throws_like($$select public.choose_payment_method(pg_temp.order_of('00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-0000000000b1'), 'cash')$$, '%checking your proof%',
  'the shop can''t switch to cash while its proof is being checked');
select throws_like($$select public.admin_review_payment_proof(
  (select id from public.payment_proofs where status = 'pending'), true, 336, null)$$,
  '%Not authorised%', 'a shop can''t approve its own proof');

select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
set local role authenticated;
select is((select count(*)::int from public.payment_proofs), 0, 'shops can''t see other shops'' proofs');
reset role;

-- An admin rejects it, then approves the next one
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select throws_like($$select public.admin_review_payment_proof(
  (select id from public.payment_proofs where status = 'pending'), false, null, ' ')$$,
  '%Say why%', 'rejecting needs a reason');
select public.admin_review_payment_proof((select id from public.payment_proofs where status = 'pending'),
  false, null, 'Not in our bank account yet');
select is((select payment_status from public.orders where user_id = '00000000-0000-0000-0000-00000000c002'),
  'awaiting_payment', 'a rejected proof sends the order back to waiting for payment');

select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
insert into storage.objects (bucket_id, name) values ('payment-proofs', '00000000-0000-0000-0000-00000000c002/proof-2.jpg');
select public.submit_payment_proof(pg_temp.order_of('00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-0000000000b1'), '00000000-0000-0000-0000-00000000c002/proof-2.jpg');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_review_payment_proof((select id from public.payment_proofs where status = 'pending'),
  true, 336, 'Found in FNB statement');
select results_eq($$select o.payment_status, o.amount_paid, pr.status from public.orders o
  join public.payment_proofs pr on pr.order_id = o.id and pr.file_path like '%proof-2.jpg'
  where o.user_id = '00000000-0000-0000-0000-00000000c002'$$,
  $$values ('paid'::text, 336.00::numeric(12,2), 'approved'::text)$$,
  'approving the proof marks the order paid');

-- A pays cash at the door: part first, then the rest
select public.admin_record_payment(pg_temp.order_of('00000000-0000-0000-0000-00000000c001',
  '00000000-0000-0000-0000-0000000000b1'), 200, null, 'At the door', 'verified', 'cash');
select results_eq($$select payment_status, amount_paid from public.orders where user_id = '00000000-0000-0000-0000-00000000c001'$$,
  $$values ('awaiting_payment'::text, 200.00::numeric(12,2))$$, 'a part payment leaves the rest owed');
select public.admin_record_payment(pg_temp.order_of('00000000-0000-0000-0000-00000000c001',
  '00000000-0000-0000-0000-0000000000b1'), 304, null, 'At the door', 'verified', 'cash');
select results_eq($$select o.payment_status, (select count(*)::int from public.payments p where p.order_id = o.id and p.method = 'cash')
  from public.orders o where o.user_id = '00000000-0000-0000-0000-00000000c001'$$,
  $$values ('paid'::text, 2)$$, 'cash payments are recorded as cash and complete the order');

-- Pool 2: A pays early by EFT, B chooses cash, C never confirms. The pool fails.
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.join_pool('00000000-0000-0000-0000-0000000000b2', 6);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select public.join_pool('00000000-0000-0000-0000-0000000000b2', 2);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c003');
select public.join_pool('00000000-0000-0000-0000-0000000000b2', 2);
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select public.confirm_order(pg_temp.order_of('00000000-0000-0000-0000-00000000c001',
  '00000000-0000-0000-0000-0000000000b2'), true, 'eft');
select pg_temp.act_as('00000000-0000-0000-0000-00000000c002');
select public.confirm_order(pg_temp.order_of('00000000-0000-0000-0000-00000000c002',
  '00000000-0000-0000-0000-0000000000b2'), true, 'cash');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.admin_record_payment(pg_temp.order_of('00000000-0000-0000-0000-00000000c001',
  '00000000-0000-0000-0000-0000000000b2'), 504, 'EFT-1', null, 'verified', 'eft');
update public.pools set closes_at = now() - interval '1 second', payment_deadline = now() - interval '1 second'
  where id = '00000000-0000-0000-0000-0000000000b2';
select is(public.finalise_funding('00000000-0000-0000-0000-0000000000b2'), 'failed', 'short of confirmations, the pool fails');
select results_eq($$select o.user_id::text, o.status, o.payment_status, r.amount from public.orders o
  left join public.refunds r on r.order_id = o.id
  where o.pool_id = '00000000-0000-0000-0000-0000000000b2' order by o.user_id$$,
  $$values ('00000000-0000-0000-0000-00000000c001'::text, 'failed'::text, 'paid'::text, 504.00::numeric(12,2)),
           ('00000000-0000-0000-0000-00000000c002'::text, 'failed'::text, 'not_due'::text, null::numeric(12,2)),
           ('00000000-0000-0000-0000-00000000c003'::text, 'expired'::text, 'expired'::text, null::numeric(12,2))$$,
  'only the shop that paid early gets money back');
select is((select status from public.pools where id = '00000000-0000-0000-0000-0000000000b2'),
  'refund_resolution', 'the pool waits for the refund to be paid');

-- Internal helpers stay private
select ok(not has_function_privilege('anon', 'public.submit_payment_proof(uuid, text)', 'execute'),
  'signed-out visitors can''t send proofs');

select * from finish();
rollback;

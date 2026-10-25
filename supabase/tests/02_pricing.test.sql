begin;
select plan(9);

-- Act as a signed-in user (auth.uid() reads the JWT claims)
create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'admin@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c001', 'shop@test.local', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000ad01', 'admin');
insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province)
values ('00000000-0000-0000-0000-00000000c001', 'Shop', 'Sipho', '+27600000002', 'Gugulethu', 'Cape Town', 'Western Cape');
insert into public.suppliers (id, name) values ('00000000-0000-0000-0000-0000000005e1', 'Supplier');
insert into public.products (id, sku, name) values ('00000000-0000-0000-0000-00000000f001', 'TEST-1', 'Maize meal 10kg');
insert into public.collection_points (id, name, area) values ('00000000-0000-0000-0000-0000000000c9', 'Point', 'Area');
update public.app_settings set value = '{"discount_share_pct": 20}' where key = 'pricing';

select is(public.pool_price(250, 200, 20), 210.00, 'pool_price: list 250, bulk 200, 20% share gives 210');

-- A shop proposes a pool without a price
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select lives_ok(
  $$select public.propose_pool('00000000-0000-0000-0000-00000000f001', 'bag', 10, null, 1, null,
      now(), now() + interval '7 days', '00000000-0000-0000-0000-0000000000c9', null, false)$$,
  'a shop can propose a pool without a price'
);
select is((select price from public.pools where proposed_by = '00000000-0000-0000-0000-00000000c001'), null,
  'the proposal has no price yet');

-- The admin prices and publishes it
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select throws_like(
  $$select public.admin_publish_pool((select id from public.pools where proposed_by = '00000000-0000-0000-0000-00000000c001'))$$,
  '%supplier%', 'publishing needs a supplier'
);
update public.pools set supplier_id = '00000000-0000-0000-0000-0000000005e1', reference_price = 180
  where proposed_by = '00000000-0000-0000-0000-00000000c001';
insert into public.pool_costs (pool_id, supplier_cost)
  select id, 200 from public.pools where proposed_by = '00000000-0000-0000-0000-00000000c001';
select throws_like(
  $$select public.admin_publish_pool((select id from public.pools where proposed_by = '00000000-0000-0000-0000-00000000c001'))$$,
  '%list price must be higher%', 'publishing needs a real discount'
);
update public.pools set reference_price = 250 where proposed_by = '00000000-0000-0000-0000-00000000c001';
select lives_ok(
  $$select public.admin_publish_pool((select id from public.pools where proposed_by = '00000000-0000-0000-0000-00000000c001'))$$,
  'publishes once list and bulk prices are set'
);
select results_eq(
  $$select status, price, discount_share_pct from public.pools where proposed_by = '00000000-0000-0000-0000-00000000c001'$$,
  $$values ('open'::text, 210.00::numeric(12,2), 20.00::numeric(5,2))$$,
  'publishing sets the derived price and records the share'
);

-- Later setting changes don't move a published price
update public.app_settings set value = '{"discount_share_pct": 50}' where key = 'pricing';
select is((select price from public.pools where proposed_by = '00000000-0000-0000-0000-00000000c001'), 210.00::numeric(12,2),
  'changing the share leaves published prices alone');
select throws_like(
  $$update public.pools set reference_price = 300 where proposed_by = '00000000-0000-0000-0000-00000000c001'$$,
  '%locked after publication%', 'list price is locked after publishing'
);

select * from finish();
rollback;

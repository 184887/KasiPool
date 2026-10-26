-- Test data on production (2026-10-26): the team tests end to end on the live app with test shops
-- and test pools, kept apart from real data:
-- - businesses.is_test and pools.is_test mark test data. Shops can't set the flag themselves.
-- - Real shops never see or join test pools. Test shops see the real deals but can only join, or
--   ask for, test pools.
-- - Any admin can reset the test data from Admin -> Settings (admin_reset_test_data). The loader
--   lives in private.* so clients can't call it directly.
-- The admin dashboard and reports leave test pools out (client side).

-- ===== Flags =====
alter table public.businesses add column is_test boolean not null default false;
alter table public.pools add column is_test boolean not null default false;

-- Shops write their own business row: keep is_test as it was (false for a new row). The
-- SECURITY DEFINER loader runs as the function owner, so it can set it.
create or replace function public.trg_keep_business_test_flag() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.is_test := case when tg_op = 'INSERT' then false else old.is_test end;
  end if;
  return new;
end $$;
create trigger keep_business_test_flag before insert or update on public.businesses
  for each row execute function public.trg_keep_business_test_flag();

create or replace function public.is_test_shop() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_test from public.businesses where user_id = auth.uid()), false)
$$;

-- ===== Who sees which pools =====
drop policy "public read published" on public.pools;
create policy "public read published" on public.pools for select using (
  public.is_admin() or (
    (not is_test or public.is_test_shop())
    and (proposed_by = auth.uid() or (status <> 'draft' and (not is_private or exists (
      select 1 from public.pool_members m where m.pool_id = pools.id and m.user_id = auth.uid()))))
  )
);

create or replace function public.my_pool_distances()
returns table (pool_id uuid, distance_km int, radius_km numeric, in_range boolean)
language plpgsql stable security definer set search_path = public as $$
declare b public.businesses; d record;
begin
  if auth.uid() is null then return; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then return; end if;
  select * into d from private.business_delivery(b);
  if d.latitude is null or d.longitude is null then return; end if;
  return query
    select l.pool_id,
           round(private.distance_km(d.latitude, d.longitude, l.latitude, l.longitude))::int,
           l.radius_km,
           private.distance_km(d.latitude, d.longitude, l.latitude, l.longitude) <= l.radius_km
    from public.pool_locations l
    join public.pools p on p.id = l.pool_id
    where not p.is_private and p.status <> 'draft' and (not p.is_test or b.is_test);
end $$;

-- ===== Who joins which pools =====
-- Latest join_pool (20261025162051) plus the test checks
create or replace function public.join_pool(_pool uuid, _qty int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.pools; b public.businesses; existing public.participations; others int; prior public.orders;
begin
  if auth.uid() is null then raise exception 'Please log in first'; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then raise exception 'Please add your business details first'; end if;
  perform public.refresh_pool_states();
  select * into p from public.pools where id = _pool for update;
  if p.id is null or (p.is_test and not b.is_test) then raise exception 'Deal not found'; end if;
  if b.is_test and not p.is_test then raise exception 'Test shops can only join test pools.'; end if;
  if p.is_sample then raise exception 'This is a sample deal. You can''t join it.'; end if;
  if p.is_private and not exists(select 1 from public.pool_members where pool_id = _pool and user_id = auth.uid()) then
    raise exception 'This is a private group. Type its code to join.';
  end if;
  if p.status <> 'open' or p.closes_at <= now() then raise exception 'This pool is closed'; end if;
  select * into prior from public.orders where pool_id = _pool and user_id = auth.uid() order by created_at desc limit 1;
  if prior.id is not null then
    if prior.status = 'confirmed' then raise exception 'You already have an order in this deal'; end if;
    raise exception 'You did not pay for your last order in this deal, so you can''t join it again';
  end if;
  if _qty is null or _qty < p.min_per_customer then raise exception 'You must order at least %', p.min_per_customer; end if;
  if p.max_per_customer is not null and _qty > p.max_per_customer then raise exception 'You can order at most %', p.max_per_customer; end if;
  perform private.check_pool_distance(_pool, b);
  select * into existing from public.participations where pool_id = _pool and user_id = auth.uid();
  others := p.pledged_qty - coalesce(case when existing.status = 'active' then existing.quantity end, 0);
  if p.max_qty is not null and others + _qty > p.max_qty then raise exception 'This pool only has space for % more', greatest(p.max_qty - others,0); end if;
  if existing.id is null then
    insert into public.participations(pool_id, user_id, business_id, quantity) values (_pool, auth.uid(), b.id, _qty);
    perform public.notify(auth.uid(), 'You joined a pool', 'You want ' || private.qty_text(_qty, p.unit) || '. You do not pay now. We will tell you when the pool is full.', '/offers/' || _pool);
  else
    update public.participations set quantity = _qty, status = 'active', updated_at = now() where id = existing.id;
  end if;
  perform public.recalc_pool(_pool);
  perform public.refresh_pool_states();
  return jsonb_build_object('updated', existing.id is not null);
end $$;

create or replace function public.claim_pool_invite(_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if auth.uid() is null then raise exception 'Please log in first'; end if;
  select id into pid from public.pools where invite_code = upper(trim(_code)) and is_private
    and status <> 'draft' and is_test = public.is_test_shop();
  if pid is null then raise exception 'We can''t find this code, or it is too old'; end if;
  insert into public.pool_members(pool_id, user_id) values (pid, auth.uid()) on conflict do nothing;
  return pid;
end $$;

-- Latest propose_pool (20261025162051): a test shop's request becomes a test pool
create or replace function public.propose_pool(_product uuid, _unit text, _min_qty integer, _max_qty integer,
  _min_per integer, _max_per integer, _opens timestamptz, _closes timestamptz, _note text,
  _private boolean default false) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid; uid uuid := auth.uid(); b public.businesses; d record;
begin
  if uid is null then raise exception 'Please log in first'; end if;
  select * into b from public.businesses where user_id = uid;
  if b.id is null then raise exception 'Please add your business details first'; end if;
  select * into d from private.business_delivery(b);
  if d.latitude is null or d.longitude is null then
    raise exception 'Please add your business location (map pin) in your profile first';
  end if;
  if not exists(select 1 from public.products where id = _product and active) then raise exception 'Please choose a product'; end if;
  if coalesce(_min_qty,0) <= 0 then raise exception 'Please say how many are needed in total'; end if;
  if _max_qty is not null and _max_qty < _min_qty then raise exception 'The most the pool can take must not be less than the number needed'; end if;
  if _closes <= greatest(_opens, now()) then raise exception 'The closing date must be after the opening date'; end if;
  if (select count(*) from public.pools where proposed_by = uid and status = 'draft') >= 5 then
    raise exception 'You already asked for 5 deals. Please wait for us to check them.';
  end if;
  insert into public.pools(product_id, unit, min_qty, max_qty, min_per_customer, max_per_customer,
      opens_at, closes_at, fulfilment_note, status, proposed_by, is_private, invite_code, is_test)
    values (_product, coalesce(nullif(trim(_unit),''),'unit'), _min_qty, _max_qty, greatest(coalesce(_min_per,1),1), _max_per,
      coalesce(_opens, now()), _closes, nullif(trim(_note),''), 'draft', uid, coalesce(_private,false),
      case when coalesce(_private,false) then upper(substr(md5(random()::text || clock_timestamp()::text),1,8)) end,
      b.is_test)
    returning id into pid;
  insert into public.pool_locations (pool_id, latitude, longitude, label)
    values (pid, d.latitude, d.longitude, b.trading_name || ', ' || b.township);
  if coalesce(_private,false) then insert into public.pool_members(pool_id, user_id) values (pid, uid); end if;
  perform public.audit('propose_pool','pool',pid);
  return pid;
end $$;

-- ===== Test data loader (see docs/testing.md) =====
-- Test shops are 060 000 0001 to 0007 with PIN 123456. Test pools are in the "Test data" campaign,
-- centred on the Cape Flats (15 km), one per stage of the pool lifecycle. Every step runs through
-- the app's own functions, acting as each shop or as the admin who asked for the reset.

create or replace function private.test_act_as(_uid uuid) returns void
language sql set search_path = public as $$
  select set_config('request.jwt.claims', json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
$$;

create or replace function private.test_shop(_n int) returns uuid
language sql stable set search_path = public as $$
  select id from auth.users where email = '2760000000' || _n || '@phone.kasipool.co.za'
$$;

create or replace function private.test_order_of(_n int, _pool uuid) returns uuid
language sql stable set search_path = public as $$
  select id from public.orders where pool_id = _pool and user_id = private.test_shop(_n)
  order by created_at desc limit 1
$$;

create or replace function private.test_make_shop(_n int, _name text, _rep text, _category text,
  _township text, _address text, _lat double precision, _lon double precision) returns void
language plpgsql set search_path = public as $$
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
      province, address, latitude, longitude, is_test)
    values (uid, _name, _rep, '+2760000000' || _n, _category, _township, 'Cape Town',
      'Western Cape', _address, _lat, _lon, true);
end $$;

-- A published test pool, centred on the Cape Flats
create or replace function private.test_make_pool(_admin uuid, _sku text, _list numeric,
  _bulk numeric, _min int, _max_per int, _opens interval default interval '-2 days') returns uuid
language plpgsql set search_path = public as $$
declare pid uuid; pr public.products;
begin
  select * into pr from public.products where sku = _sku;
  insert into public.pools (campaign_id, product_id, supplier_id, unit, reference_price,
      reference_source, reference_date, min_qty, max_per_customer, opens_at, closes_at,
      confirm_window_hours, fulfilment_note, is_test)
    values ('7e57da7a-0000-4000-8000-000000000001', pr.id, 'ca5e0000-0000-4000-8000-000000000001',
      pr.unit, _list, 'Estimated cash & carry price, October 2026', current_date, _min, _max_per,
      now() + _opens, now() + interval '7 days', 48, 'Test pool: no stock will be delivered.', true)
    returning id into pid;
  insert into public.pool_costs (pool_id, supplier_cost) values (pid, _bulk);
  insert into public.pool_locations (pool_id, latitude, longitude, radius_km, label)
    values (pid, -34.0000, 18.6000, 15, 'Cape Flats (test)');
  perform private.test_act_as(_admin);
  perform public.admin_publish_pool(pid);
  return pid;
end $$;

create or replace function private.test_join(_n int, _pool uuid, _qty int) returns void
language plpgsql set search_path = public as $$
begin
  perform private.test_act_as(private.test_shop(_n));
  perform public.join_pool(_pool, _qty);
end $$;

create or replace function private.test_confirm(_n int, _pool uuid) returns void
language plpgsql set search_path = public as $$
begin
  perform private.test_act_as(private.test_shop(_n));
  perform public.confirm_order(private.test_order_of(_n, _pool), true);
end $$;

-- Confirm, then the admin records the full EFT as verified
create or replace function private.test_pay(_admin uuid, _n int, _pool uuid) returns void
language plpgsql set search_path = public as $$
declare o public.orders;
begin
  perform private.test_confirm(_n, _pool);
  select * into o from public.orders where id = private.test_order_of(_n, _pool);
  perform private.test_act_as(_admin);
  perform public.admin_record_payment(o.id, o.total, 'TEST-EFT-' || o.ref, 'Test data', 'verified');
end $$;

-- Every order in the pool confirmed and paid, then funding finalised
create or replace function private.test_fund(_admin uuid, _pool uuid) returns void
language plpgsql set search_path = public as $$
declare o record;
begin
  for o in select id, user_id from public.orders where pool_id = _pool and status = 'awaiting_confirmation' loop
    perform private.test_act_as(o.user_id);
    perform public.confirm_order(o.id, true);
  end loop;
  perform private.test_act_as(_admin);
  for o in select id, total, ref from public.orders where pool_id = _pool and status = 'confirmed' loop
    perform public.admin_record_payment(o.id, o.total, 'TEST-EFT-' || o.ref, 'Test data', 'verified');
  end loop;
  perform public.admin_finalise_funding(_pool);
end $$;

-- Removes the test shops, everything they did and every test pool. Real deals a test shop was
-- in (only possible before this migration) are recounted.
create or replace function private.clear_test_data() returns text
language plpgsql set search_path = public as $$
declare uids uuid[]; pids uuid[]; oids uuid[]; touched uuid[]; pid uuid;
begin
  select coalesce(array_agg(id), '{}') into uids from auth.users
    where raw_app_meta_data ->> 'test_data' = 'true'
       or id in (select user_id from public.businesses where is_test);
  select coalesce(array_agg(id), '{}') into pids from public.pools
    where is_test or campaign_id = '7e57da7a-0000-4000-8000-000000000001' or proposed_by = any(uids);
  select coalesce(array_agg(id), '{}') into oids from public.orders
    where pool_id = any(pids) or user_id = any(uids);
  select coalesce(array_agg(distinct pool_id), '{}') into touched
    from (select pool_id from public.participations where user_id = any(uids)
          union all select pool_id from public.orders where user_id = any(uids)) t
    where not pool_id = any(pids);

  delete from public.refunds where order_id = any(oids);
  delete from public.payments where order_id = any(oids);
  delete from public.orders where id = any(oids);
  delete from public.purchase_orders where pool_id = any(pids);
  delete from public.participations where pool_id = any(pids) or user_id = any(uids);
  delete from public.notifications n
    where exists (select 1 from unnest(pids || oids) x where n.link like '%' || x::text || '%');
  delete from public.pools where id = any(pids);
  delete from public.businesses where user_id = any(uids);
  delete from auth.users where id = any(uids);
  delete from public.campaigns where id = '7e57da7a-0000-4000-8000-000000000001';
  foreach pid in array touched loop
    perform public.recalc_pool(pid);
  end loop;
  return format('Removed %s test shops and %s test pools', cardinality(uids), cardinality(pids));
end $$;

-- Loads fresh test data, acting as _admin for the admin steps. Run clear_test_data first.
create or replace function private.load_test_data(_admin uuid) returns text
language plpgsql set search_path = public as $$
declare pid uuid; claims text := current_setting('request.jwt.claims', true);
begin
  if not public.has_role(_admin, 'admin') then raise exception 'The test data must act as an admin'; end if;
  if exists (select 1 from auth.users where email like '2760000000_@phone.kasipool.co.za') then
    raise exception 'A real account uses one of the test numbers (060 000 0001 to 0009). Clear the test data first, or ask a developer.';
  end if;

  insert into public.campaigns (id, name, description)
  values ('7e57da7a-0000-4000-8000-000000000001', 'Test data',
    'Test pools for trying the app end to end. Reset or remove them in Admin, Settings.');

  perform private.test_make_shop(1, 'Thandeka''s Spaza (test)', 'Thandeka Mbeki', 'Spaza / general dealer',
    'Khayelitsha', '12 Ntlazane Road, Site C, Khayelitsha', -34.0310, 18.6620);
  perform private.test_make_shop(2, 'Lwazi Car Wash (test)', 'Lwazi Ndlovu', 'Car wash',
    'Khayelitsha', 'Corner of Govan Mbeki and Oscar Mpetha Road, Harare', -34.0560, 18.6680);
  perform private.test_make_shop(3, 'Nomsa''s Hair Salon (test)', 'Nomsa Dube', 'Hair & beauty salon',
    'Gugulethu', 'NY 1, next to the taxi rank, Gugulethu', -33.9800, 18.5700);
  perform private.test_make_shop(4, 'Langa Fresh Bakery (test)', 'Sipho Mahlangu', 'Bakery',
    'Langa', 'Washington Street, Langa', -33.9440, 18.5290);
  perform private.test_make_shop(5, 'Rocklands Mini Market (test)', 'Fatima Isaacs', 'Spaza / general dealer',
    'Mitchells Plain', 'AZ Berman Drive, Rocklands, Mitchells Plain', -34.0480, 18.6160);
  perform private.test_make_shop(6, 'Philippi Kota King (test)', 'Bongani Zulu', 'Takeaway / food vendor',
    'Philippi', 'Lansdowne Road, Philippi', -34.0100, 18.5900);
  perform private.test_make_shop(7, 'Mbekweni Corner Shop (test)', 'Ayanda Khumalo', 'Spaza / general dealer',
    'Mbekweni', 'Main Road, Mbekweni, Paarl', -33.6990, 18.9900);

  -- 1. Open, almost full: shop 1 joining with 4 or more fills it and it closes
  pid := private.test_make_pool(_admin, 'KP-MAI-10', 105, 90, 30, 20);
  perform private.test_join(2, pid, 8); perform private.test_join(3, pid, 8);
  perform private.test_join(4, pid, 6); perform private.test_join(5, pid, 4);

  -- 2. Open, just started: join, change the amount, leave
  pid := private.test_make_pool(_admin, 'KP-RIC-10', 189, 165, 60, 20);
  perform private.test_join(3, pid, 5); perform private.test_join(5, pid, 5);

  -- 3. Full, waiting for shops: shop 1 must confirm, shop 2 confirmed but not paid, 3 and 4 paid
  pid := private.test_make_pool(_admin, 'KP-SUG-10', 235, 205, 30, 15);
  perform private.test_join(1, pid, 10); perform private.test_join(2, pid, 8);
  perform private.test_join(3, pid, 7); perform private.test_join(4, pid, 5);
  perform private.test_confirm(2, pid);
  perform private.test_pay(_admin, 3, pid); perform private.test_pay(_admin, 4, pid);

  -- 4. Paid: admin authorises the supplier order
  pid := private.test_make_pool(_admin, 'KP-OIL-2L6', 345, 300, 20, 10);
  perform private.test_join(1, pid, 5); perform private.test_join(2, pid, 5);
  perform private.test_join(3, pid, 5); perform private.test_join(5, pid, 5);
  perform private.test_fund(_admin, pid);

  -- 5. Ordered from the supplier: admin records what arrived (try fewer, to see refunds)
  pid := private.test_make_pool(_admin, 'KP-FLR-10', 165, 145, 20, 10);
  perform private.test_join(1, pid, 6); perform private.test_join(4, pid, 8);
  perform private.test_join(6, pid, 6);
  perform private.test_fund(_admin, pid);
  perform private.test_act_as(_admin);
  perform public.admin_create_po(pid, 'TEST-PO-FLOUR', current_date, current_date + 3);

  -- 6. Stock received: admin sends it out for delivery
  pid := private.test_make_pool(_admin, 'KP-BEV-2L6', 150, 130, 30, 10);
  perform private.test_join(1, pid, 10); perform private.test_join(2, pid, 10);
  perform private.test_join(6, pid, 10);
  perform private.test_fund(_admin, pid);
  perform private.test_act_as(_admin);
  perform public.admin_create_po(pid, 'TEST-PO-COKE', current_date, current_date + 2);
  perform public.admin_receive_stock(pid, 30, null);

  -- 7. Out for delivery: shop 1 confirms or reports a problem; shop 2 marked delivered by the
  --    courier; shop 3 already confirmed
  pid := private.test_make_pool(_admin, 'KP-DSH-750', 360, 315, 10, 5);
  perform private.test_join(1, pid, 3); perform private.test_join(2, pid, 3);
  perform private.test_join(3, pid, 4);
  perform private.test_fund(_admin, pid);
  perform private.test_act_as(_admin);
  perform public.admin_create_po(pid, 'TEST-PO-SUNLIGHT', current_date, current_date + 2);
  perform public.admin_receive_stock(pid, 10, null);
  perform public.admin_dispatch_pool(pid, 'TEST-COURIER-1');
  perform public.admin_mark_delivered(private.test_order_of(2, pid), 'Test data');
  perform private.test_act_as(private.test_shop(3));
  perform public.confirm_delivery_received(private.test_order_of(3, pid));

  -- 8. Done: everyone got their stock
  pid := private.test_make_pool(_admin, 'KP-SAL-1', 130, 110, 10, 10);
  perform private.test_join(1, pid, 4); perform private.test_join(5, pid, 6);
  perform private.test_fund(_admin, pid);
  perform private.test_act_as(_admin);
  perform public.admin_create_po(pid, 'TEST-PO-SALT', current_date, current_date + 2);
  perform public.admin_receive_stock(pid, 10, null);
  perform public.admin_dispatch_pool(pid, 'TEST-COURIER-2');
  perform private.test_act_as(private.test_shop(1));
  perform public.confirm_delivery_received(private.test_order_of(1, pid));
  perform private.test_act_as(private.test_shop(5));
  perform public.confirm_delivery_received(private.test_order_of(5, pid));

  -- 9. Failed after paying: shop 6 did not pay and the closing time passed, so shops 1 and 4
  --    are owed refunds
  pid := private.test_make_pool(_admin, 'KP-BRD-125', 190, 165, 20, 10);
  perform private.test_join(1, pid, 6); perform private.test_join(4, pid, 6);
  perform private.test_join(6, pid, 8);
  perform private.test_pay(_admin, 1, pid); perform private.test_pay(_admin, 4, pid);
  update public.pools set closes_at = now() - interval '1 minute' where id = pid;
  perform private.test_act_as(_admin);
  perform public.admin_skip_ahead(pid);

  -- 10. Reopened: shop 5 did not pay, so the deal is open again for 8 more
  pid := private.test_make_pool(_admin, 'KP-YST-500', 95, 80, 20, 10);
  perform private.test_join(1, pid, 6); perform private.test_join(3, pid, 6);
  perform private.test_join(5, pid, 8);
  perform private.test_pay(_admin, 1, pid); perform private.test_pay(_admin, 3, pid);
  perform private.test_act_as(_admin);
  perform public.admin_skip_ahead(pid);

  -- 11. Private group asked for by shop 2: others join with code CARWASH1
  perform private.test_act_as(private.test_shop(2));
  pid := public.propose_pool((select id from public.products where sku = 'KP-CAR-5L4'), 'box', 6,
    null, 1, 3, now(), now() + interval '7 days', 'Car washes in Khayelitsha buying together', true);
  update public.pools set campaign_id = '7e57da7a-0000-4000-8000-000000000001',
      supplier_id = 'ca5e0000-0000-4000-8000-000000000001', reference_price = 520,
      reference_source = 'Estimated cash & carry price, October 2026', invite_code = 'CARWASH1'
    where id = pid;
  insert into public.pool_costs (pool_id, supplier_cost) values (pid, 440);
  perform private.test_act_as(_admin);
  perform public.admin_publish_pool(pid);
  perform private.test_join(2, pid, 2);

  -- 12. Asked for by shop 3, waiting for an admin to check prices and publish
  perform private.test_act_as(private.test_shop(3));
  perform public.propose_pool((select id from public.products where sku = 'KP-RLX-6'), 'box', 10,
    null, 1, 4, now(), now() + interval '10 days', 'Salons in Gugulethu and Nyanga', false);

  -- 13. Opens tomorrow: admin can open it now with "Testing: open now"
  perform private.test_make_pool(_admin, 'KP-BEV-2L6', 150, 130, 40, 10, interval '1 day');

  perform set_config('request.jwt.claims', coalesce(claims, ''), true);
  return 'Loaded 7 test shops and 13 test pools';
end $$;

-- Admin -> Settings: reset (clear and load) or remove the test data
create or replace function public.admin_reset_test_data(_load boolean default true) returns text
language plpgsql security definer set search_path = public as $$
declare admin_id uuid := auth.uid(); res text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  res := private.clear_test_data();
  if _load then res := private.load_test_data(admin_id); end if;
  perform public.audit(case when _load then 'reset_test_data' else 'remove_test_data' end,
    'test_data', null, jsonb_build_object('result', res));
  return res;
end $$;
revoke execute on function public.admin_reset_test_data(boolean) from public, anon;
grant execute on function public.admin_reset_test_data(boolean) to authenticated;

-- ===== Move the existing local test data (from supabase/test-data) under the new flags =====
update public.pools set is_test = true where campaign_id = '7e57da7a-0000-4000-8000-000000000001';
update public.businesses set is_test = true
  where user_id in (select id from auth.users where raw_app_meta_data ->> 'test_data' = 'true');
update public.pools set is_test = true
  where proposed_by in (select id from auth.users where raw_app_meta_data ->> 'test_data' = 'true');

-- ===== Skip ahead only on test pools =====
-- Ending a real deal's payment time early would close orders that still had time to pay.
create or replace function public.admin_skip_ahead(_pool uuid) returns text
language plpgsql security definer set search_path = public as $$
declare p public.pools; res text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Pool not found'; end if;
  if not p.is_test then raise exception 'Skip ahead only works on test pools'; end if;
  if p.status = 'scheduled' then
    update public.pools set opens_at = now(), status = 'open' where id = _pool;
    res := 'opened';
  elsif p.status = 'awaiting_confirmation' then
    update public.pools set payment_deadline = now() where id = _pool;
    res := public.finalise_funding(_pool);
  else
    raise exception 'Only scheduled pools and pools waiting for payment can skip ahead';
  end if;
  perform public.audit('skip_ahead', 'pool', _pool, jsonb_build_object('from', p.status, 'result', res));
  return res;
end $$;

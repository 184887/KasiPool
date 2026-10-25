-- Delivery instead of collection (business review 2026-10-25):
-- - Third-party couriers deliver to each shop. Collection points, collection codes and the
--   15 km radius are removed.
-- - Admins define delivery zones, each with a flat delivery fee per order. A pool lists the zones
--   it delivers to; a shop can join if its delivery address is in one of them (private groups too).
-- - Every business has a compulsory business address and zone, plus an optional second delivery
--   address. Orders keep a copy of the address and fee they were delivered with.
-- - Delivery steps: out for delivery -> delivered (admin, from the courier) -> received (shop).
--   Shops can report a problem with a delivery.

-- ===== Zones =====
create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  areas text,
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now());
comment on column public.delivery_zones.areas is 'Suburbs and townships in the zone, shown to shops when they pick one';
alter table public.delivery_zones enable row level security;
grant select on public.delivery_zones to anon, authenticated;
grant insert, update, delete on public.delivery_zones to authenticated;
create policy "public read" on public.delivery_zones for select using (true);
create policy "admin write" on public.delivery_zones for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table public.pool_zones (
  pool_id uuid not null references public.pools(id) on delete cascade,
  zone_id uuid not null references public.delivery_zones(id) on delete restrict,
  primary key (pool_id, zone_id));
create index pool_zones_zone_id_idx on public.pool_zones(zone_id);
alter table public.pool_zones enable row level security;
grant select on public.pool_zones to anon, authenticated;
grant insert, delete on public.pool_zones to authenticated;
create policy "public read" on public.pool_zones for select using (true);
create policy "admin write" on public.pool_zones for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ===== Business addresses =====
alter table public.businesses
  add column zone_id uuid references public.delivery_zones(id),
  add column delivery_address text,
  add column delivery_latitude double precision,
  add column delivery_longitude double precision,
  add column delivery_zone_id uuid references public.delivery_zones(id),
  add column deliver_to text not null default 'business' check (deliver_to in ('business', 'other'));
-- NOT VALID: existing profiles are only checked the next time they are saved
alter table public.businesses
  add constraint businesses_address_required
    check (address is not null and btrim(address) <> '' and zone_id is not null) not valid,
  add constraint businesses_other_address_complete
    check (deliver_to = 'business'
      or (delivery_address is not null and btrim(delivery_address) <> '' and delivery_zone_id is not null)) not valid;

-- Internal helpers live in a schema the Data API doesn't expose
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Where a business wants its stock delivered
create or replace function private.business_delivery(_b public.businesses)
returns table (address text, latitude double precision, longitude double precision, zone_id uuid)
language sql stable set search_path = public as $$
  select case when _b.deliver_to = 'other' then _b.delivery_address else _b.address end,
         case when _b.deliver_to = 'other' then _b.delivery_latitude else _b.latitude end,
         case when _b.deliver_to = 'other' then _b.delivery_longitude else _b.longitude end,
         case when _b.deliver_to = 'other' then _b.delivery_zone_id else _b.zone_id end
$$;

-- ===== Orders =====
alter table public.orders
  add column delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  add column delivery_zone_id uuid references public.delivery_zones(id),
  add column delivery_address text,
  add column delivery_latitude double precision,
  add column delivery_longitude double precision,
  add column courier_ref text,
  add column out_for_delivery_at timestamptz,
  add column delivered_at timestamptz,
  add column received_at timestamptz,
  add column problem_note text,
  add column problem_reported_at timestamptz;
comment on column public.orders.total is 'Amount due: quantity x unit_price + delivery_fee';

update public.orders set fulfilment_status = 'allocated' where fulfilment_status = 'ready';
update public.orders set fulfilment_status = 'received', received_at = collected_at where fulfilment_status = 'collected';
alter table public.orders drop constraint orders_fulfilment_status_check;
alter table public.orders add constraint orders_fulfilment_status_check check (fulfilment_status in
  ('none', 'ordered', 'allocated', 'short', 'out_for_delivery', 'delivered', 'received'));
alter table public.orders
  drop column collection_code, drop column ready_at, drop column collected_at, drop column collected_by;

-- ===== Pools =====
update public.pools set status = 'stock_received' where status = 'ready_for_collection';
alter table public.pools drop constraint pools_status_check;
alter table public.pools add constraint pools_status_check check (status in
  ('draft', 'scheduled', 'open', 'awaiting_confirmation', 'funded', 'procurement', 'stock_received',
   'out_for_delivery', 'completed', 'unsuccessful', 'cancelled', 'refund_resolution'));

-- ===== Remove collection points and the distance rule =====
drop function if exists public.admin_mark_ready(uuid);
drop function if exists public.admin_collect(uuid, text);
alter table public.pools drop column collection_point_id, drop column max_distance_km;
drop table public.collection_points;
drop function if exists public.distance_km(double precision, double precision, double precision, double precision);

-- ===== Helpers =====
create or replace function public.notify_admins(_title text, _body text, _link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(user_id, title, body, link)
  select user_id, _title, _body, _link from public.user_roles where role = 'admin';
$$;
revoke execute on function public.notify_admins(text, text, text) from public, anon, authenticated;

-- Copies the shop's delivery address and zone fee onto an unpaid order and recalculates its total
create or replace function public.set_order_delivery(_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; b public.businesses; d record; fee numeric;
begin
  select * into o from public.orders where id = _order for update;
  if o.amount_paid > 0 or o.payment_status = 'paid' then return; end if;
  select * into b from public.businesses where id = o.business_id;
  select * into d from private.business_delivery(b);
  select delivery_fee into fee from public.delivery_zones where id = d.zone_id;
  update public.orders set
    delivery_address = d.address, delivery_latitude = d.latitude, delivery_longitude = d.longitude,
    delivery_zone_id = d.zone_id, delivery_fee = coalesce(fee, 0),
    total = o.quantity * o.unit_price + coalesce(fee, 0)
  where id = _order;
end $$;
revoke execute on function public.set_order_delivery(uuid) from public, anon, authenticated;

-- Raises a friendly error if the business can't get deliveries for this pool
create or replace function public.check_delivery_zone(_pool uuid, _b public.businesses) returns void
language plpgsql stable security definer set search_path = public as $$
declare z uuid; zname text;
begin
  select zone_id into z from private.business_delivery(_b);
  if z is null then
    raise exception 'Add your delivery address and area to your profile first';
  end if;
  if exists (select 1 from public.pool_zones where pool_id = _pool)
     and not exists (select 1 from public.pool_zones where pool_id = _pool and zone_id = z) then
    select name into zname from public.delivery_zones where id = z;
    raise exception 'This deal doesn''t deliver to % yet', zname;
  end if;
end $$;
revoke execute on function public.check_delivery_zone(uuid, public.businesses) from public, anon, authenticated;

-- ===== Lifecycle functions (latest versions, with delivery) =====
create or replace function public.join_pool(_pool uuid, _qty int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.pools; b public.businesses; existing public.participations; others int;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then raise exception 'Please complete your business profile first'; end if;
  perform public.refresh_pool_states();
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Deal not found'; end if;
  if p.is_sample then raise exception 'This is a sample deal. It shows how KasiPool works and can''t be joined.'; end if;
  if p.is_private and not exists(select 1 from public.pool_members where pool_id = _pool and user_id = auth.uid()) then
    raise exception 'This is a private group. Enter its invite code to join.';
  end if;
  if p.status <> 'open' or p.closes_at <= now() then raise exception 'This pool is no longer open'; end if;
  if _qty is null or _qty < p.min_per_customer then raise exception 'Minimum quantity is %', p.min_per_customer; end if;
  if p.max_per_customer is not null and _qty > p.max_per_customer then raise exception 'Maximum per business is %', p.max_per_customer; end if;
  perform public.check_delivery_zone(_pool, b);
  select * into existing from public.participations where pool_id = _pool and user_id = auth.uid();
  select coalesce(sum(quantity),0) into others from public.participations where pool_id = _pool and status = 'active' and user_id <> auth.uid();
  if p.max_qty is not null and others + _qty > p.max_qty then raise exception 'Only % more can be added to this pool', greatest(p.max_qty - others,0); end if;
  if existing.id is null then
    insert into public.participations(pool_id, user_id, business_id, quantity) values (_pool, auth.uid(), b.id, _qty);
    perform public.notify(auth.uid(), 'You joined a pool', 'You registered interest in ' || _qty || ' ' || p.unit || '(s). No payment needed yet.', '/offers/' || _pool);
  else
    update public.participations set quantity = _qty, status = 'active', updated_at = now() where id = existing.id;
  end if;
  perform public.recalc_pool(_pool);
  perform public.refresh_pool_states();
  return jsonb_build_object('updated', existing.id is not null);
end $$;
grant execute on function public.join_pool(uuid,int) to authenticated;

create or replace function public.close_pool(_pool uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.pools; part record; pname text; oid uuid;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'open' then return; end if;
  select name into pname from public.products where id = p.product_id;
  if p.pledged_qty >= p.min_qty then
    update public.pools set status = 'awaiting_confirmation', qualified_at = now(), closed_at = now(),
      payment_deadline = now() + make_interval(hours => p.confirm_window_hours) where id = _pool;
    for part in select * from public.participations where pool_id = _pool and status = 'active' loop
      insert into public.orders(pool_id, participation_id, user_id, business_id, quantity, unit_price, total)
      values (_pool, part.id, part.user_id, part.business_id, part.quantity, p.price, p.price * part.quantity)
      returning id into oid;
      perform public.set_order_delivery(oid);
      update public.participations set status = 'converted' where id = part.id;
      perform public.notify(part.user_id, 'Target reached: confirm your order',
        'The ' || pname || ' pool reached its target. Please confirm your order before the deadline.', '/my-pools');
    end loop;
  else
    update public.pools set status = 'unsuccessful', closed_at = now(), outcome_note = 'Minimum target not reached by the closing time.' where id = _pool;
    for part in select * from public.participations where pool_id = _pool and status = 'active' loop
      perform public.notify(part.user_id, 'Deal unsuccessful',
        'The ' || pname || ' pool did not reach its target. No payment is required.', '/my-pools');
    end loop;
  end if;
end $$;
revoke execute on function public.close_pool(uuid) from public, anon, authenticated;

create or replace function public.confirm_order(_order uuid, _accept boolean) returns text
language plpgsql security definer set search_path = public as $$
declare o public.orders; p public.pools; b public.businesses; tv text; reference text;
begin
  select * into o from public.orders where id = _order and user_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'awaiting_confirmation' then raise exception 'This order can no longer be confirmed'; end if;
  select * into p from public.pools where id = o.pool_id;
  if p.status <> 'awaiting_confirmation' or p.payment_deadline <= now() then raise exception 'The confirmation window has closed'; end if;
  if not _accept then raise exception 'You must accept the terms to confirm'; end if;
  -- Re-check the delivery address in case the shop changed it since joining
  select * into b from public.businesses where id = o.business_id;
  perform public.check_delivery_zone(o.pool_id, b);
  perform public.set_order_delivery(_order);
  select value->>'version' into tv from public.app_settings where key = 'terms';
  reference := 'KP-' || to_char(now() at time zone 'Africa/Johannesburg','YYMM') || '-' || nextval('public.order_ref_seq');
  update public.orders set status = 'confirmed', confirmed_at = now(), terms_version = coalesce(tv,'v0.1-draft'),
    ref = reference, payment_reference = reference, payment_status = 'awaiting_payment' where id = _order;
  perform public.notify(auth.uid(), 'Payment required', 'Order ' || reference || ' confirmed. Please pay before the deadline.', '/orders/' || _order);
  return reference;
end $$;
grant execute on function public.confirm_order(uuid, boolean) to authenticated;

create or replace function public.admin_publish_pool(_pool uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.pools; bulk numeric; share numeric; new_price numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'draft' then raise exception 'Only drafts can be published'; end if;
  if p.closes_at <= now() then raise exception 'Closing time must be in the future'; end if;
  if p.supplier_id is null then raise exception 'Choose a supplier before publishing'; end if;
  if not exists (select 1 from public.pool_zones where pool_id = _pool) then
    raise exception 'Choose at least one delivery zone before publishing';
  end if;
  select supplier_cost into bulk from public.pool_costs where pool_id = _pool;
  if bulk is null then raise exception 'Enter the supplier bulk price before publishing'; end if;
  if p.reference_price is null then raise exception 'Enter the supplier list price before publishing'; end if;
  if p.reference_price <= bulk then
    raise exception 'The list price must be higher than the bulk price, otherwise there is no discount';
  end if;
  share := public.discount_share_pct();
  if share < 0 or share > 100 then raise exception 'KasiPool share must be between 0 and 100 percent'; end if;
  new_price := public.pool_price(p.reference_price, bulk, share);
  update public.pools
    set price = new_price, discount_share_pct = share,
        status = case when opens_at > now() then 'scheduled' else 'open' end
    where id = _pool;
  perform public.audit('publish_pool', 'pool', _pool,
    jsonb_build_object('price', new_price, 'list_price', p.reference_price, 'bulk_price', bulk, 'share_pct', share));
end $$;
grant execute on function public.admin_publish_pool(uuid) to authenticated;

-- Shop proposals deliver to the proposer's zone (an admin can add more before publishing)
drop function if exists public.propose_pool(uuid,text,int,int,int,int,timestamptz,timestamptz,uuid,text,boolean);
create or replace function public.propose_pool(
  _product uuid, _unit text, _min_qty int, _max_qty int,
  _min_per int, _max_per int, _opens timestamptz, _closes timestamptz,
  _note text, _private boolean default false
) returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid; uid uuid := auth.uid(); b public.businesses; z uuid;
begin
  if uid is null then raise exception 'Please sign in'; end if;
  select * into b from public.businesses where user_id = uid;
  if b.id is null then raise exception 'Complete your business profile before starting a pool'; end if;
  select zone_id into z from private.business_delivery(b);
  if z is null then raise exception 'Add your delivery address and area to your profile first'; end if;
  if not exists(select 1 from public.products where id = _product and active) then raise exception 'Choose an available product'; end if;
  if coalesce(_min_qty,0) <= 0 then raise exception 'Enter a minimum quantity'; end if;
  if _max_qty is not null and _max_qty < _min_qty then raise exception 'Maximum must be at least the minimum'; end if;
  if _closes <= greatest(_opens, now()) then raise exception 'Closing time must be in the future and after opening'; end if;
  if (select count(*) from public.pools where proposed_by = uid and status = 'draft') >= 5 then
    raise exception 'You already have 5 proposals awaiting review';
  end if;
  insert into public.pools(product_id, unit, min_qty, max_qty, min_per_customer, max_per_customer,
      opens_at, closes_at, fulfilment_note, status, proposed_by, is_private, invite_code)
    values (_product, coalesce(nullif(trim(_unit),''),'unit'), _min_qty, _max_qty, greatest(coalesce(_min_per,1),1), _max_per,
      coalesce(_opens, now()), _closes, nullif(trim(_note),''), 'draft', uid, coalesce(_private,false),
      case when coalesce(_private,false) then upper(substr(md5(random()::text || clock_timestamp()::text),1,8)) end)
    returning id into pid;
  insert into public.pool_zones(pool_id, zone_id) values (pid, z);
  if coalesce(_private,false) then insert into public.pool_members(pool_id, user_id) values (pid, uid); end if;
  perform public.audit('propose_pool','pool',pid);
  return pid;
end $$;
grant execute on function public.propose_pool(uuid,text,int,int,int,int,timestamptz,timestamptz,text,boolean) to authenticated;

-- Stock receipt: allocate paid orders in payment order. Orders that get nothing are refunded in
-- full (including the delivery fee); partly filled orders get the missing goods refunded.
create or replace function public.admin_receive_stock(_pool uuid, _received int, _note text) returns void
language plpgsql security definer set search_path = public as $$
declare po public.purchase_orders; remaining int; o record; give int; pname text; owed numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into po from public.purchase_orders where pool_id = _pool for update;
  if po.id is null or po.status <> 'ordered' then raise exception 'No open purchase order for this pool'; end if;
  if _received < 0 then raise exception 'Invalid quantity'; end if;
  update public.purchase_orders set received_qty = _received, discrepancy_note = _note, received_at = now(),
    status = case when _received >= po.quantity then 'received' else 'partially_received' end where id = po.id;
  remaining := _received;
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  for o in select * from public.orders where pool_id = _pool and status = 'confirmed' and payment_status = 'paid' order by paid_at nulls last, confirmed_at loop
    give := least(o.quantity, remaining);
    remaining := remaining - give;
    update public.orders set allocated_qty = give, fulfilment_status = case when give >= o.quantity then 'allocated' else 'short' end where id = o.id;
    if give < o.quantity then
      owed := (o.quantity - give) * o.unit_price + case when give = 0 then o.delivery_fee else 0 end;
      insert into public.refunds(order_id, amount, reason) values (o.id, owed, 'Supplier short delivery: ' || (o.quantity - give) || ' unit(s) not received');
      perform public.notify(o.user_id, 'Stock shortfall', 'The supplier delivered less ' || pname || ' than ordered. A refund is due.', '/orders/' || o.id);
    end if;
  end loop;
  update public.pools set status = 'stock_received' where id = _pool;
  perform public.audit('receive_stock','pool',_pool, jsonb_build_object('received',_received,'ordered',po.quantity,'note',_note));
end $$;
grant execute on function public.admin_receive_stock(uuid,int,text) to authenticated;

-- ===== Delivery steps =====
create or replace function public.complete_pool_if_delivered(_pool uuid) returns void
language sql security definer set search_path = public as $$
  update public.pools set status = 'completed'
  where id = _pool and status = 'out_for_delivery'
    and not exists (select 1 from public.orders where pool_id = _pool and fulfilment_status = 'out_for_delivery');
$$;
revoke execute on function public.complete_pool_if_delivered(uuid) from public, anon, authenticated;

create or replace function public.admin_dispatch_pool(_pool uuid, _courier_ref text) returns int
language plpgsql security definer set search_path = public as $$
declare o record; n int := 0; pname text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if (select status from public.pools where id = _pool) <> 'stock_received' then raise exception 'Record stock receipt first'; end if;
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  for o in select * from public.orders where pool_id = _pool and fulfilment_status in ('allocated','short') and allocated_qty > 0 loop
    update public.orders set fulfilment_status = 'out_for_delivery', out_for_delivery_at = now(),
      courier_ref = nullif(trim(_courier_ref), '') where id = o.id;
    perform public.notify(o.user_id, 'Out for delivery',
      'Your ' || pname || ' is on its way to ' || coalesce(o.delivery_address, 'your shop') || '.', '/orders/' || o.id);
    n := n + 1;
  end loop;
  update public.pools set status = 'out_for_delivery' where id = _pool;
  perform public.complete_pool_if_delivered(_pool);
  perform public.audit('dispatch_pool','pool',_pool, jsonb_build_object('orders',n,'courier_ref',_courier_ref));
  return n;
end $$;
grant execute on function public.admin_dispatch_pool(uuid, text) to authenticated;

-- The courier reported the delivery to KasiPool
create or replace function public.admin_mark_delivered(_order uuid, _note text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.orders set fulfilment_status = 'delivered', delivered_at = now()
    where id = _order and fulfilment_status = 'out_for_delivery' returning * into o;
  if o.id is null then raise exception 'This order is not out for delivery'; end if;
  perform public.notify(o.user_id, 'Delivered', 'The courier says order ' || o.ref || ' was delivered. Please confirm you received it.', '/orders/' || _order);
  perform public.audit('mark_delivered','order',_order, jsonb_build_object('note',_note));
  perform public.complete_pool_if_delivered(o.pool_id);
end $$;
grant execute on function public.admin_mark_delivered(uuid, text) to authenticated;

-- The shop confirms it received its stock
create or replace function public.confirm_delivery_received(_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  update public.orders set fulfilment_status = 'received', received_at = now(),
      delivered_at = coalesce(delivered_at, now())
    where id = _order and user_id = auth.uid() and fulfilment_status in ('out_for_delivery','delivered')
    returning * into o;
  if o.id is null then raise exception 'This order is not out for delivery'; end if;
  perform public.notify(o.user_id, 'Order completed', 'Thanks for confirming order ' || o.ref || '. Thank you for pooling with KasiPool.', '/orders/' || _order);
  perform public.audit('confirm_received','order',_order);
  perform public.complete_pool_if_delivered(o.pool_id);
end $$;
grant execute on function public.confirm_delivery_received(uuid) to authenticated;

create or replace function public.report_delivery_problem(_order uuid, _note text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if coalesce(btrim(_note), '') = '' then raise exception 'Tell us what went wrong'; end if;
  update public.orders set problem_note = btrim(_note), problem_reported_at = now()
    where id = _order and user_id = auth.uid() and fulfilment_status in ('out_for_delivery','delivered','received')
    returning * into o;
  if o.id is null then raise exception 'You can report a problem once your order is out for delivery'; end if;
  perform public.notify_admins('Delivery problem', 'Order ' || o.ref || ': ' || btrim(_note), '/admin/deliveries');
  perform public.audit('delivery_problem','order',_order, jsonb_build_object('note',_note));
end $$;
grant execute on function public.report_delivery_problem(uuid, text) to authenticated;

create or replace function public.admin_resolve_delivery_problem(_order uuid, _note text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.orders set problem_note = null, problem_reported_at = null
    where id = _order and problem_reported_at is not null returning * into o;
  if o.id is null then raise exception 'No open problem on this order'; end if;
  perform public.notify(o.user_id, 'Delivery problem resolved', coalesce(nullif(btrim(_note), ''), 'KasiPool has resolved the problem you reported.'), '/orders/' || _order);
  perform public.audit('resolve_delivery_problem','order',_order, jsonb_build_object('note',_note));
end $$;
grant execute on function public.admin_resolve_delivery_problem(uuid, text) to authenticated;

-- Pools by distance instead of delivery areas (2026-10-25). Every pool gets a centre and a radius
-- (default 10 km). A business can join a public pool when the place its stock goes to is inside
-- that radius. Pools a shop asks for are centred on that shop (the "hub"); admins choose the centre
-- of pools they create. Private groups have no distance limit. The map pin becomes required.
-- Delivery fees are parked: one flat fee per order in app_settings, R0 (free) for now.
-- delivery_zones, pool_zones and the zone columns stay in place, unused, in case areas come back.

-- ===== Pool centre and radius (admin-only: the centre of a shop's pool is that shop's pin) =====
create table public.pool_locations (
  pool_id uuid primary key references public.pools(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_km numeric(5,1) not null default 10 check (radius_km > 0 and radius_km <= 100),
  label text,
  updated_at timestamptz not null default now()
);
alter table public.pool_locations enable row level security;
create policy "admin all" on public.pool_locations for all using (public.is_admin()) with check (public.is_admin());

-- Straight-line distance in km between two points (haversine)
create or replace function private.distance_km(_lat1 double precision, _lon1 double precision,
  _lat2 double precision, _lon2 double precision) returns double precision
language sql immutable set search_path = public as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(_lat2 - _lat1) / 2), 2)
    + cos(radians(_lat1)) * cos(radians(_lat2)) * power(sin(radians(_lon2 - _lon1) / 2), 2)))
$$;

-- Raises a plain message when this business can't join the pool because of distance
create or replace function private.check_pool_distance(_pool uuid, _b public.businesses) returns void
language plpgsql stable set search_path = public as $$
declare d record; l public.pool_locations; km double precision; priv boolean;
begin
  select * into d from private.business_delivery(_b);
  if d.latitude is null or d.longitude is null then
    raise exception 'Please add your business location (map pin) in your profile first';
  end if;
  select is_private into priv from public.pools where id = _pool;
  if priv then return; end if;
  select * into l from public.pool_locations where pool_id = _pool;
  if l.pool_id is null then return; end if; -- older pools without a centre are open to all
  km := private.distance_km(d.latitude, d.longitude, l.latitude, l.longitude);
  if km > l.radius_km then
    raise exception 'This deal is only for businesses within % km. You are % km away.',
      trim(to_char(l.radius_km, 'FM990.9'), '.'), round(km::numeric);
  end if;
end $$;

drop function public.check_delivery_zone(uuid, public.businesses);

-- Distance from the signed-in business to each public pool with a centre. Only the rounded
-- distance is shared, never where the pool is centred.
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
    where not p.is_private and p.status <> 'draft';
end $$;
revoke execute on function public.my_pool_distances() from public, anon;
grant execute on function public.my_pool_distances() to authenticated;

-- Admin: set or move a pool's centre and radius
create or replace function public.admin_set_pool_location(_pool uuid, _lat double precision,
  _lon double precision, _radius numeric, _label text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if _lat is null or _lon is null then raise exception 'Choose where the deal is centred'; end if;
  if _radius is null or _radius <= 0 or _radius > 100 then
    raise exception 'The distance must be between 1 and 100 km';
  end if;
  insert into public.pool_locations (pool_id, latitude, longitude, radius_km, label)
    values (_pool, _lat, _lon, _radius, nullif(btrim(_label), ''))
  on conflict (pool_id) do update set latitude = excluded.latitude, longitude = excluded.longitude,
    radius_km = excluded.radius_km, label = excluded.label, updated_at = now();
  perform public.audit('set_pool_location', 'pool', _pool, jsonb_build_object('radius_km', _radius));
end $$;
grant execute on function public.admin_set_pool_location(uuid, double precision, double precision, numeric, text) to authenticated;

-- ===== Businesses: map pin required, no area =====
alter table public.businesses drop constraint businesses_address_required;
alter table public.businesses drop constraint businesses_other_address_complete;
alter table public.businesses add constraint businesses_address_required check (
  address is not null and btrim(address) <> '' and latitude is not null and longitude is not null
) not valid;
alter table public.businesses add constraint businesses_other_address_complete check (
  deliver_to = 'business' or (delivery_address is not null and btrim(delivery_address) <> ''
    and delivery_latitude is not null and delivery_longitude is not null)
) not valid;

-- ===== Delivery fee: one flat fee per order, free for now =====
insert into public.app_settings (key, value) values ('delivery', '{"fee_per_order": 0}')
on conflict (key) do nothing;

create or replace function public.set_order_delivery(_order uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare o public.orders; b public.businesses; d record; fee numeric;
begin
  select * into o from public.orders where id = _order for update;
  if o.amount_paid > 0 or o.payment_status = 'paid' then return; end if;
  select * into b from public.businesses where id = o.business_id;
  select * into d from private.business_delivery(b);
  select greatest(coalesce((value->>'fee_per_order')::numeric, 0), 0) into fee
    from public.app_settings where key = 'delivery';
  update public.orders set
    delivery_address = d.address, delivery_latitude = d.latitude, delivery_longitude = d.longitude,
    delivery_zone_id = null, delivery_fee = coalesce(fee, 0),
    total = o.quantity * o.unit_price + coalesce(fee, 0)
  where id = _order;
end $function$;

-- ===== Lifecycle functions: distance instead of areas =====
create or replace function public.admin_publish_pool(_pool uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare p public.pools; bulk numeric; share numeric; new_price numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'draft' then raise exception 'Only drafts can be published'; end if;
  if p.closes_at <= now() then raise exception 'Closing time must be in the future'; end if;
  if p.supplier_id is null then raise exception 'Choose a supplier before publishing'; end if;
  if not p.is_private and not exists (select 1 from public.pool_locations where pool_id = _pool) then
    raise exception 'Choose where this deal is centred before publishing';
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
end $function$;

create or replace function public.confirm_order(_order uuid, _accept boolean)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare o public.orders; p public.pools; b public.businesses; tv text; reference text;
begin
  select * into o from public.orders where id = _order and user_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'awaiting_confirmation' then raise exception 'You can''t confirm this order any more'; end if;
  select * into p from public.pools where id = o.pool_id;
  if p.status <> 'awaiting_confirmation' or p.payment_deadline <= now() then raise exception 'The time to confirm is over'; end if;
  if not _accept then raise exception 'Please tick the box to accept the terms'; end if;
  -- Re-check the delivery address in case the business changed it since joining
  select * into b from public.businesses where id = o.business_id;
  perform private.check_pool_distance(o.pool_id, b);
  perform public.set_order_delivery(_order);
  select value->>'version' into tv from public.app_settings where key = 'terms';
  reference := 'KP-' || to_char(now() at time zone 'Africa/Johannesburg','YYMM') || '-' || nextval('public.order_ref_seq');
  update public.orders set status = 'confirmed', confirmed_at = now(), terms_version = coalesce(tv,'v0.1-draft'),
    ref = reference, payment_reference = reference, payment_status = 'awaiting_payment' where id = _order;
  perform public.notify(auth.uid(), 'Please pay now', 'Order ' || reference || ' is confirmed. Please pay before the deadline. Use ' || reference || ' as the reference.', '/orders/' || _order);
  return reference;
end $function$;

create or replace function public.join_pool(_pool uuid, _qty integer)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare p public.pools; b public.businesses; existing public.participations; others int; prior public.orders;
begin
  if auth.uid() is null then raise exception 'Please log in first'; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then raise exception 'Please add your business details first'; end if;
  perform public.refresh_pool_states();
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Deal not found'; end if;
  if p.is_sample then raise exception 'This is a sample deal. You can''t join it.'; end if;
  if p.is_private and not exists(select 1 from public.pool_members where pool_id = _pool and user_id = auth.uid()) then
    raise exception 'This is a private group. Type its code to join.';
  end if;
  if p.status <> 'open' or p.closes_at <= now() then raise exception 'This pool is closed'; end if;
  -- A business gets one order per pool: it can't rejoin a reopened pool it already ordered from
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
end $function$;

-- A business asking for a deal becomes its hub: the pool is centred on where its stock goes
create or replace function public.propose_pool(_product uuid, _unit text, _min_qty integer, _max_qty integer,
  _min_per integer, _max_per integer, _opens timestamp with time zone, _closes timestamp with time zone,
  _note text, _private boolean default false)
 returns uuid language plpgsql security definer set search_path to 'public'
as $function$
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
      opens_at, closes_at, fulfilment_note, status, proposed_by, is_private, invite_code)
    values (_product, coalesce(nullif(trim(_unit),''),'unit'), _min_qty, _max_qty, greatest(coalesce(_min_per,1),1), _max_per,
      coalesce(_opens, now()), _closes, nullif(trim(_note),''), 'draft', uid, coalesce(_private,false),
      case when coalesce(_private,false) then upper(substr(md5(random()::text || clock_timestamp()::text),1,8)) end)
    returning id into pid;
  insert into public.pool_locations (pool_id, latitude, longitude, label)
    values (pid, d.latitude, d.longitude, b.trading_name || ', ' || b.township);
  if coalesce(_private,false) then insert into public.pool_members(pool_id, user_id) values (pid, uid); end if;
  perform public.audit('propose_pool','pool',pid);
  return pid;
end $function$;

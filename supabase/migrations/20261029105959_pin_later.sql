-- Map pin later (2026-10-29). Township addresses rarely have street numbers, so the map pin is how
-- a driver finds a shop, and the best pin is one set with the phone's GPS while standing there.
-- Shops are often not at the shop when they sign up, so the pin no longer blocks sign-up:
-- - At sign-up a shop gives its township or area. The app looks up the area's centre and saves it
--   as an approximate location, used only to work out distances to deals.
-- - The exact pin can be set any time later, and must be set before confirming an order
--   (KasiPool then spends its own money on the stock and needs to deliver it).
-- The same goes for the optional second delivery address.

alter table public.businesses
  add column approx_latitude double precision,
  add column approx_longitude double precision,
  add column postal_code text,
  add column delivery_area text,
  add column delivery_approx_latitude double precision,
  add column delivery_approx_longitude double precision;

-- An address (or directions) plus either the exact pin or the area's approximate location
alter table public.businesses drop constraint businesses_address_required;
alter table public.businesses add constraint businesses_address_required check (
  address is not null and btrim(address) <> ''
  and ((latitude is not null and longitude is not null)
    or (approx_latitude is not null and approx_longitude is not null))
) not valid;
alter table public.businesses drop constraint businesses_other_address_complete;
alter table public.businesses add constraint businesses_other_address_complete check (
  deliver_to = 'business' or (
    delivery_address is not null and btrim(delivery_address) <> ''
    and ((delivery_latitude is not null and delivery_longitude is not null)
      or (delivery_approx_latitude is not null and delivery_approx_longitude is not null)))
) not valid;

-- Where a business's stock goes: the exact pin if it has one, otherwise the approximate location
drop function private.business_delivery(public.businesses);
create function private.business_delivery(_b public.businesses)
 returns table(address text, latitude double precision, longitude double precision, zone_id uuid,
   exact boolean)
 language sql stable set search_path to 'public'
as $function$
  select case when _b.deliver_to = 'other' then _b.delivery_address else _b.address end,
         case when _b.deliver_to = 'other' then coalesce(_b.delivery_latitude, _b.delivery_approx_latitude)
              else coalesce(_b.latitude, _b.approx_latitude) end,
         case when _b.deliver_to = 'other' then coalesce(_b.delivery_longitude, _b.delivery_approx_longitude)
              else coalesce(_b.longitude, _b.approx_longitude) end,
         case when _b.deliver_to = 'other' then _b.delivery_zone_id else _b.zone_id end,
         case when _b.deliver_to = 'other' then _b.delivery_latitude is not null and _b.delivery_longitude is not null
              else _b.latitude is not null and _b.longitude is not null end
$function$;

create or replace function private.check_pool_distance(_pool uuid, _b public.businesses)
 returns void language plpgsql stable set search_path to 'public'
as $function$
declare d record; l public.pool_locations; km double precision; priv boolean;
begin
  select * into d from private.business_delivery(_b);
  if d.latitude is null or d.longitude is null then
    raise exception 'Please add your township or area in your profile first';
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
end $function$;

-- Confirming needs the exact pin of where the stock goes
create or replace function public.confirm_order(_order uuid, _accept boolean, _method text default null)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare o public.orders; p public.pools; b public.businesses; tv text; reference text; d record;
begin
  select * into o from public.orders where id = _order and user_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'awaiting_confirmation' then raise exception 'You can''t confirm this order any more'; end if;
  select * into p from public.pools where id = o.pool_id;
  if p.status <> 'awaiting_confirmation' or p.payment_deadline <= now() then raise exception 'The time to confirm is over'; end if;
  if not _accept then raise exception 'Please tick the box to accept the terms'; end if;
  if _method is null or _method not in ('cash', 'eft') then raise exception 'Choose how you will pay'; end if;
  select * into b from public.businesses where id = o.business_id;
  select * into d from private.business_delivery(b);
  if not coalesce(d.exact, false) then
    raise exception 'Set your map pin first, so the driver can find you';
  end if;
  -- Re-check the distance with the exact pin, in case it is further than the area suggested
  perform private.check_pool_distance(o.pool_id, b);
  perform public.set_order_delivery(_order);
  select value->>'version' into tv from public.app_settings where key = 'terms';
  reference := 'KP-' || to_char(now() at time zone 'Africa/Johannesburg','YYMM') || '-' || nextval('public.order_ref_seq');
  update public.orders set status = 'confirmed', confirmed_at = now(), terms_version = coalesce(tv,'v0.1-draft'),
    ref = reference, payment_reference = reference, payment_status = 'awaiting_payment',
    payment_method = _method where id = _order returning * into o;
  perform public.notify(auth.uid(), 'Order confirmed',
    case when _method = 'cash'
      then 'Order ' || reference || ' is confirmed. Pay R' || to_char(o.total, 'FM999999990.00') || ' in cash when your stock arrives.'
      else 'Order ' || reference || ' is confirmed. Pay when your stock arrives: by EFT with reference ' || reference
        || ', then send us your proof of payment in the app.'
    end, '/orders/' || _order);
  perform public.recalc_pool(o.pool_id);
  return reference;
end $function$;

-- When the pool fills, shops without an exact pin are reminded they need it to confirm
create or replace function public.close_pool(_pool uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare p public.pools; part record; pname text; oid uuid; b public.businesses; d record;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'open' then return; end if;
  select name into pname from public.products where id = p.product_id;
  if p.pledged_qty >= p.min_qty then
    update public.pools set status = 'awaiting_confirmation', qualified_at = now(), closed_at = now(),
      payment_deadline = now() + make_interval(hours => p.confirm_window_hours) where id = _pool;
    -- Only open interest becomes new orders; orders confirmed before a reopen stay as they are
    for part in select * from public.participations where pool_id = _pool and status = 'active' loop
      insert into public.orders(pool_id, participation_id, user_id, business_id, quantity, unit_price, total)
      values (_pool, part.id, part.user_id, part.business_id, part.quantity, p.price, p.price * part.quantity)
      returning id into oid;
      perform public.set_order_delivery(oid);
      update public.participations set status = 'converted' where id = part.id;
      select * into b from public.businesses where id = part.business_id;
      select * into d from private.business_delivery(b);
      perform public.notify(part.user_id, 'The pool is full: please confirm',
        'The ' || pname || ' pool is full. Please confirm your order before the deadline. You pay when your stock arrives.'
        || case when coalesce(d.exact, false) then ''
             else ' First set your map pin: you need it to confirm.' end, '/my-pools');
    end loop;
  else
    perform public.fail_pool(_pool, 'Minimum target not reached by the closing time.');
  end if;
end $function$;

-- ===== Test data: shop 1 starts with only its area, to try setting the pin =====
alter function private.load_test_data(uuid) rename to load_test_stages;
create function private.load_test_data(_admin uuid) returns text
language plpgsql set search_path = public as $$
declare res text;
begin
  res := private.load_test_stages(_admin);
  update public.businesses set approx_latitude = latitude, approx_longitude = longitude,
      latitude = null, longitude = null
    where user_id = private.test_shop(1);
  return res;
end $$;

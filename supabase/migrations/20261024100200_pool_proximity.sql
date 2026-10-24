-- Keep pool members close to the collection point to save on delivery/collection costs.
alter table public.collection_points add column if not exists latitude double precision, add column if not exists longitude double precision;
alter table public.businesses add column if not exists latitude double precision, add column if not exists longitude double precision;
alter table public.pools add column if not exists max_distance_km int not null default 15 check (max_distance_km between 1 and 500);

create or replace function public.distance_km(_lat1 double precision, _lng1 double precision, _lat2 double precision, _lng2 double precision)
returns double precision language sql immutable as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(_lat2 - _lat1) / 2), 2) +
    cos(radians(_lat1)) * cos(radians(_lat2)) * power(sin(radians(_lng2 - _lng1) / 2), 2)))
$$;

create or replace function public.join_pool(_pool uuid, _qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.pools; b public.businesses; existing public.participations; others int; cp public.collection_points; km double precision;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then raise exception 'Please complete your business profile first'; end if;
  perform public.refresh_pool_states();
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Offer not found'; end if;
  if p.status <> 'open' or p.closes_at <= now() then raise exception 'This pool is no longer open'; end if;
  if _qty is null or _qty < p.min_per_customer then raise exception 'Minimum quantity is %', p.min_per_customer; end if;
  if p.max_per_customer is not null and _qty > p.max_per_customer then raise exception 'Maximum per business is %', p.max_per_customer; end if;
  select * into cp from public.collection_points where id = p.collection_point_id;
  if cp.latitude is not null and cp.longitude is not null then
    if b.latitude is null or b.longitude is null then
      raise exception 'Add your business location to your profile to join pools near you';
    end if;
    km := public.distance_km(b.latitude, b.longitude, cp.latitude, cp.longitude);
    if km > p.max_distance_km then
      raise exception 'This pool is for businesses within % km of the collection point (you are about % km away)', p.max_distance_km, round(km::numeric);
    end if;
  end if;
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

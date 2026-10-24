-- Sample deals: example pools (restored from the Lovable prototype) that show how KasiPool
-- works. They are listed like real deals but labelled "Sample deal", and nobody can join them.
alter table public.pools add column if not exists is_sample boolean not null default false;

-- Latest join_pool (from 20261024160000) plus the is_sample check.
create or replace function public.join_pool(_pool uuid, _qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.pools; b public.businesses; existing public.participations; others int; cp public.collection_points; km double precision;
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
  if not p.is_private then
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

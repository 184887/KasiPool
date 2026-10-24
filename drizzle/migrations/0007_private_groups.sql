-- Private (invite-only) pools: hidden from the public catalogue, joined with an invite code or link.
alter table public.pools add column if not exists is_private boolean not null default false;
alter table public.pools add column if not exists invite_code text unique;

create table if not exists public.pool_members (
  pool_id uuid not null references public.pools(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (pool_id, user_id));
alter table public.pool_members enable row level security;
grant select on public.pool_members to authenticated;
drop policy if exists "own membership" on public.pool_members;
create policy "own membership" on public.pool_members for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "public read published" on public.pools;
create policy "public read published" on public.pools for select using (
  public.is_admin() or proposed_by = auth.uid()
  or (status <> 'draft' and (not is_private or exists(select 1 from public.pool_members m where m.pool_id = pools.id and m.user_id = auth.uid()))));

create or replace function public.claim_pool_invite(_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select id into pid from public.pools where invite_code = upper(trim(_code)) and is_private and status <> 'draft';
  if pid is null then raise exception 'Invite code not found or no longer valid'; end if;
  insert into public.pool_members(pool_id, user_id) values (pid, auth.uid()) on conflict do nothing;
  return pid;
end $$;
grant execute on function public.claim_pool_invite(text) to authenticated;

drop function if exists public.propose_pool(uuid,text,numeric,int,int,int,int,timestamptz,timestamptz,uuid,text);
create or replace function public.propose_pool(
  _product uuid, _unit text, _price numeric, _min_qty int, _max_qty int,
  _min_per int, _max_per int, _opens timestamptz, _closes timestamptz,
  _collection_point uuid, _note text, _private boolean default false
) returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Please sign in'; end if;
  if not exists(select 1 from public.businesses where user_id = uid) then
    raise exception 'Complete your business profile before starting a pool';
  end if;
  if not exists(select 1 from public.products where id = _product and active) then raise exception 'Choose an available product'; end if;
  if not exists(select 1 from public.collection_points where id = _collection_point and active) then raise exception 'Choose a collection point'; end if;
  if coalesce(_price,0) <= 0 then raise exception 'Enter a price'; end if;
  if coalesce(_min_qty,0) <= 0 then raise exception 'Enter a minimum quantity'; end if;
  if _max_qty is not null and _max_qty < _min_qty then raise exception 'Maximum must be at least the minimum'; end if;
  if _closes <= greatest(_opens, now()) then raise exception 'Closing time must be in the future and after opening'; end if;
  if (select count(*) from public.pools where proposed_by = uid and status = 'draft') >= 5 then
    raise exception 'You already have 5 proposals awaiting review';
  end if;
  insert into public.pools(product_id, unit, price, min_qty, max_qty, min_per_customer, max_per_customer,
      opens_at, closes_at, collection_point_id, fulfilment_note, status, proposed_by, is_private, invite_code)
    values (_product, coalesce(nullif(trim(_unit),''),'unit'), _price, _min_qty, _max_qty, greatest(coalesce(_min_per,1),1), _max_per,
      coalesce(_opens, now()), _closes, _collection_point, nullif(trim(_note),''), 'draft', uid, coalesce(_private,false),
      case when coalesce(_private,false) then upper(substr(md5(random()::text || clock_timestamp()::text),1,8)) end)
    returning id into pid;
  if coalesce(_private,false) then insert into public.pool_members(pool_id, user_id) values (pid, uid); end if;
  perform public.audit('propose_pool','pool',pid);
  return pid;
end $$;
grant execute on function public.propose_pool(uuid,text,numeric,int,int,int,int,timestamptz,timestamptz,uuid,text,boolean) to authenticated;

-- join_pool: private pools need membership; the distance limit applies to public pools only.
create or replace function public.join_pool(_pool uuid, _qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.pools; b public.businesses; existing public.participations; others int; cp public.collection_points; km double precision;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then raise exception 'Please complete your business profile first'; end if;
  perform public.refresh_pool_states();
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Offer not found'; end if;
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
grant execute on function public.join_pool(uuid,int) to authenticated;

-- Pricing (business review 2026-10-25): KasiPool buys from the supplier and resells, keeping one
-- global percentage of the discount. The admin enters the supplier's list price
-- (pools.reference_price) and bulk price (pool_costs.supplier_cost); the pool price is derived:
--   price = list - (1 - share) * (list - bulk)
-- e.g. list R250, bulk R200, share 20%: KasiPool keeps R10, the shop pays R210 and saves R40.
-- The share used is saved on the pool at publication, so later setting changes don't move
-- live prices.

insert into public.app_settings (key, value)
values ('pricing', '{"discount_share_pct": 20}')
on conflict (key) do nothing;

alter table public.pools
  add column if not exists discount_share_pct numeric(5,2)
    check (discount_share_pct is null or discount_share_pct between 0 and 100);
-- Shops propose pools without a price; the price is set when an admin publishes
alter table public.pools alter column price drop not null;
alter table public.pools
  add constraint pools_price_set_when_published check (status = 'draft' or price is not null);
comment on column public.pools.reference_price is
  'Supplier list price per unit: the normal price the discount is measured against';

create or replace function public.pool_price(_list numeric, _bulk numeric, _share_pct numeric)
returns numeric language sql immutable set search_path = public as $$
  select round(_list - (1 - _share_pct / 100) * (_list - _bulk), 2)
$$;

create or replace function public.discount_share_pct() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select (value ->> 'discount_share_pct')::numeric from public.app_settings where key = 'pricing'),
    0)
$$;

create or replace function public.admin_publish_pool(_pool uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.pools; bulk numeric; share numeric; new_price numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'draft' then raise exception 'Only drafts can be published'; end if;
  if p.closes_at <= now() then raise exception 'Closing time must be in the future'; end if;
  if p.supplier_id is null then raise exception 'Choose a supplier before publishing'; end if;
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

-- Shop proposals no longer carry a price: the supplier's prices decide it.
drop function if exists public.propose_pool(uuid,text,numeric,int,int,int,int,timestamptz,timestamptz,uuid,text,boolean);
create or replace function public.propose_pool(
  _product uuid, _unit text, _min_qty int, _max_qty int,
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
  if coalesce(_min_qty,0) <= 0 then raise exception 'Enter a minimum quantity'; end if;
  if _max_qty is not null and _max_qty < _min_qty then raise exception 'Maximum must be at least the minimum'; end if;
  if _closes <= greatest(_opens, now()) then raise exception 'Closing time must be in the future and after opening'; end if;
  if (select count(*) from public.pools where proposed_by = uid and status = 'draft') >= 5 then
    raise exception 'You already have 5 proposals awaiting review';
  end if;
  insert into public.pools(product_id, unit, min_qty, max_qty, min_per_customer, max_per_customer,
      opens_at, closes_at, collection_point_id, fulfilment_note, status, proposed_by, is_private, invite_code)
    values (_product, coalesce(nullif(trim(_unit),''),'unit'), _min_qty, _max_qty, greatest(coalesce(_min_per,1),1), _max_per,
      coalesce(_opens, now()), _closes, _collection_point, nullif(trim(_note),''), 'draft', uid, coalesce(_private,false),
      case when coalesce(_private,false) then upper(substr(md5(random()::text || clock_timestamp()::text),1,8)) end)
    returning id into pid;
  if coalesce(_private,false) then insert into public.pool_members(pool_id, user_id) values (pid, uid); end if;
  perform public.audit('propose_pool','pool',pid);
  return pid;
end $$;
grant execute on function public.propose_pool(uuid,text,int,int,int,int,timestamptz,timestamptz,uuid,text,boolean) to authenticated;

-- Customers can start pools. Proposals are created as drafts owned by the proposer;
-- an admin adds the supplier and supplier cost, then publishes.
alter table public.pools add column if not exists proposed_by uuid;
create index if not exists pools_proposed_by_idx on public.pools(proposed_by);

drop policy if exists "public read published" on public.pools;
create policy "public read published" on public.pools for select
  using (status <> 'draft' or public.is_admin() or proposed_by = auth.uid());

create or replace function public.propose_pool(
  _product uuid, _unit text, _price numeric, _min_qty int, _max_qty int,
  _min_per int, _max_per int, _opens timestamptz, _closes timestamptz,
  _collection_point uuid, _note text
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
      opens_at, closes_at, collection_point_id, fulfilment_note, status, proposed_by)
    values (_product, coalesce(nullif(trim(_unit),''),'unit'), _price, _min_qty, _max_qty, greatest(coalesce(_min_per,1),1), _max_per,
      coalesce(_opens, now()), _closes, _collection_point, nullif(trim(_note),''), 'draft', uid)
    returning id into pid;
  perform public.audit('propose_pool','pool',pid);
  return pid;
end $$;
grant execute on function public.propose_pool(uuid,text,numeric,int,int,int,int,timestamptz,timestamptz,uuid,text) to authenticated;

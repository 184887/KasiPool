do $$
declare
  pool_ids uuid[];
begin
  select array_agg(p.id)
  into pool_ids
  from public.pools p
  where p.is_demo
     or p.product_id in (select id from public.products where is_demo)
     or p.supplier_id in (select id from public.suppliers where is_demo)
     or p.campaign_id in (select id from public.campaigns where is_demo);

  delete from public.refunds r
  using public.orders o
  where r.order_id = o.id
    and (o.is_demo or o.pool_id = any(pool_ids)
      or o.business_id in (select id from public.businesses where is_demo));

  delete from public.payments p
  using public.orders o
  where p.order_id = o.id
    and (o.is_demo or o.pool_id = any(pool_ids)
      or o.business_id in (select id from public.businesses where is_demo));

  delete from public.orders o
  where o.is_demo or o.pool_id = any(pool_ids)
     or o.business_id in (select id from public.businesses where is_demo);

  delete from public.purchase_orders po
  where po.pool_id = any(pool_ids);

  delete from public.participations part
  where part.pool_id = any(pool_ids)
     or part.business_id in (select id from public.businesses where is_demo);

  delete from public.pools p
  where p.id = any(pool_ids);

  delete from public.businesses b
  where b.is_demo;

  delete from public.products pr
  where pr.is_demo
    and not exists (select 1 from public.pools p where p.product_id = pr.id);

  delete from public.suppliers s
  where s.is_demo
    and not exists (select 1 from public.pools p where p.supplier_id = s.id)
    and not exists (select 1 from public.purchase_orders po where po.supplier_id = s.id);

  delete from public.campaigns c
  where c.is_demo
    and not exists (select 1 from public.pools p where p.campaign_id = c.id);

  delete from public.collection_points cp
  where cp.name = 'KasiPool Demo Collection Point – Orlando West'
    and not exists (select 1 from public.pools p where p.collection_point_id = cp.id);
end $$;

create or replace function public.close_pool(_pool uuid) returns void language plpgsql security definer set search_path = public as $$
declare p public.pools; part record; pname text;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'open' then return; end if;
  select name into pname from public.products where id = p.product_id;
  if p.pledged_qty >= p.min_qty then
    update public.pools set status = 'awaiting_confirmation', qualified_at = now(), closed_at = now(),
      payment_deadline = now() + make_interval(hours => p.confirm_window_hours) where id = _pool;
    for part in select * from public.participations where pool_id = _pool and status = 'active' loop
      insert into public.orders(pool_id, participation_id, user_id, business_id, quantity, unit_price, total)
      values (_pool, part.id, part.user_id, part.business_id, part.quantity, p.price, p.price * part.quantity);
      update public.participations set status = 'converted' where id = part.id;
      perform public.notify(part.user_id, 'Target reached: confirm your order',
        'The ' || pname || ' pool reached its target. Please confirm your order before the deadline.', '/my-pools');
    end loop;
  else
    update public.pools set status = 'unsuccessful', closed_at = now(), outcome_note = 'Minimum target not reached by the closing time.' where id = _pool;
    for part in select * from public.participations where pool_id = _pool and status = 'active' loop
      perform public.notify(part.user_id, 'Offer unsuccessful',
        'The ' || pname || ' pool did not reach its target. No payment is required.', '/my-pools');
    end loop;
  end if;
end $$;
revoke execute on function public.close_pool(uuid) from public, anon, authenticated;

alter table public.suppliers drop column if exists is_demo;
alter table public.products drop column if exists is_demo;
alter table public.campaigns drop column if exists is_demo;
alter table public.pools drop column if exists is_demo;
alter table public.businesses drop column if exists is_demo;
alter table public.orders drop column if exists is_demo;

-- Reopen to fill the gap (business review 2026-10-25): when the payment deadline passes and unpaid
-- orders leave the paid quantity below the target, the pool reopens for the missing quantity
-- until its original closing time. New shops join as usual; when the target is reached again the
-- new orders get their own payment window. If the closing time passes first, the pool fails and
-- every shop that paid is refunded. Paid orders stay as they are throughout.

alter table public.pools add column if not exists reopened_at timestamptz;
comment on column public.pools.reopened_at is 'Last time the pool reopened to fill a gap left by unpaid orders';

-- pledged_qty and participant_count now count live orders as well as open interest, so a
-- reopened pool shows paid quantity plus new interest.
create or replace function public.recalc_pool(_pool uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.pools p set
    pledged_qty =
      coalesce((select sum(quantity) from public.participations where pool_id = _pool and status = 'active'), 0)
      + coalesce((select sum(quantity) from public.orders where pool_id = _pool and status in ('awaiting_confirmation','confirmed')), 0),
    participant_count = (select count(distinct user_id) from (
        select user_id from public.participations where pool_id = _pool and status = 'active'
        union all
        select user_id from public.orders where pool_id = _pool and status in ('awaiting_confirmation','confirmed')) live),
    confirmed_qty = coalesce((select sum(quantity) from public.orders where pool_id = _pool and status = 'confirmed'),0),
    paid_qty = coalesce((select sum(quantity) from public.orders where pool_id = _pool and status = 'confirmed' and payment_status = 'paid'),0),
    updated_at = now()
  where p.id = _pool;
end $$;
revoke execute on function public.recalc_pool(uuid) from public, anon, authenticated;

-- Fails a pool, refunding every shop that paid (used at the deadline and the closing time)
create or replace function public.fail_pool(_pool uuid, _note text) returns text
language plpgsql security definer set search_path = public as $$
declare o record; part record; pname text; any_paid boolean;
begin
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  select exists(select 1 from public.orders where pool_id = _pool and payment_status = 'paid' and status = 'confirmed') into any_paid;
  for o in select * from public.orders where pool_id = _pool and status = 'confirmed' and payment_status = 'paid' loop
    update public.orders set status = 'failed', failure_reason = 'Pool was not fully funded' where id = o.id;
    insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Pool not funded: full refund due');
    perform public.notify(o.user_id, 'Deal unsuccessful: refund due', 'The ' || pname || ' pool was not fully funded. Your payment will be refunded.', '/orders/' || o.id);
  end loop;
  for part in select * from public.participations where pool_id = _pool and status = 'active' loop
    perform public.notify(part.user_id, 'Deal unsuccessful', 'The ' || pname || ' pool did not reach its target. No payment is required.', '/my-pools');
  end loop;
  update public.pools set status = case when any_paid then 'refund_resolution' else 'unsuccessful' end,
    closed_at = coalesce(closed_at, now()), payment_deadline = null, outcome_note = _note where id = _pool;
  perform public.recalc_pool(_pool);
  return 'failed';
end $$;
revoke execute on function public.fail_pool(uuid, text) from public, anon, authenticated;

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
    -- Only open interest becomes new orders; orders paid before a reopen stay as they are
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
    perform public.fail_pool(_pool, 'Minimum target not reached by the closing time.');
  end if;
end $$;
revoke execute on function public.close_pool(uuid) from public, anon, authenticated;

create or replace function public.finalise_funding(_pool uuid) returns text
language plpgsql security definer set search_path = public as $$
declare p public.pools; o record; pname text;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'awaiting_confirmation' then return p.status; end if;
  select name into pname from public.products where id = p.product_id;
  -- Expire anything not fully paid
  for o in select * from public.orders where pool_id = _pool and (status = 'awaiting_confirmation' or (status = 'confirmed' and payment_status <> 'paid')) loop
    update public.orders set status = 'expired', payment_status = case when payment_status in ('awaiting_payment','under_review','issue','not_due') then 'expired' else payment_status end,
      failure_reason = 'Not confirmed and fully paid before the deadline' where id = o.id;
    if o.amount_paid > 0 then
      insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Partial payment received but order expired');
    end if;
    perform public.notify(o.user_id, 'Order expired', 'Your ' || pname || ' order was not completed before the deadline.', '/orders/' || o.id);
  end loop;
  perform public.recalc_pool(_pool);
  select * into p from public.pools where id = _pool;
  if p.paid_qty >= p.min_qty then
    update public.pools set status = 'funded', outcome_note = null where id = _pool;
    for o in select * from public.orders where pool_id = _pool and payment_status = 'paid' loop
      perform public.notify(o.user_id, 'Your order is being processed', 'The ' || pname || ' pool is fully funded. We are ordering stock.', '/orders/' || o.id);
    end loop;
    return 'funded';
  end if;
  if now() < p.closes_at then
    -- Reopen for the gap until the original closing time
    update public.pools set status = 'open', payment_deadline = null, reopened_at = now(),
      outcome_note = 'Reopened: ' || (p.min_qty - p.paid_qty) || ' more ' || p.unit || '(s) needed by the closing time.'
      where id = _pool;
    for o in select * from public.orders where pool_id = _pool and payment_status = 'paid' and status = 'confirmed' loop
      perform public.notify(o.user_id, 'Deal reopened to fill the gap',
        'Some shops didn''t pay, so the ' || pname || ' deal is open again for ' || (p.min_qty - p.paid_qty)
        || ' more ' || p.unit || '(s). Your paid order is safe; if the gap isn''t filled by the closing time you''ll get a full refund.',
        '/orders/' || o.id);
    end loop;
    perform public.audit('reopen_pool', 'pool', _pool, jsonb_build_object('paid_qty', p.paid_qty, 'min_qty', p.min_qty));
    return 'reopened';
  end if;
  return public.fail_pool(_pool, 'Paid quantity (' || p.paid_qty || ') below minimum (' || p.min_qty || ') at the payment deadline.');
end $$;
revoke execute on function public.finalise_funding(uuid) from public, anon, authenticated;

create or replace function public.join_pool(_pool uuid, _qty int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.pools; b public.businesses; existing public.participations; others int; prior public.orders;
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
  -- A shop gets one order per pool: it can't rejoin a reopened pool it already ordered from
  select * into prior from public.orders where pool_id = _pool and user_id = auth.uid() order by created_at desc limit 1;
  if prior.id is not null then
    if prior.status = 'confirmed' then raise exception 'You already have an order in this deal'; end if;
    raise exception 'Your earlier order in this deal wasn''t completed, so you can''t rejoin it';
  end if;
  if _qty is null or _qty < p.min_per_customer then raise exception 'Minimum quantity is %', p.min_per_customer; end if;
  if p.max_per_customer is not null and _qty > p.max_per_customer then raise exception 'Maximum per business is %', p.max_per_customer; end if;
  perform public.check_delivery_zone(_pool, b);
  select * into existing from public.participations where pool_id = _pool and user_id = auth.uid();
  others := p.pledged_qty - coalesce(case when existing.status = 'active' then existing.quantity end, 0);
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

-- Bring stored counters in line with the new definition
do $$ declare r record; begin
  for r in select id from public.pools loop perform public.recalc_pool(r.id); end loop;
end $$;

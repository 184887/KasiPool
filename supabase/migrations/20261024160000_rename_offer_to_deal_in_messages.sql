-- Customer-facing wording: "offer" is now "deal" in notifications and messages.
-- Each function below is its latest definition, unchanged apart from those strings.

create or replace function public.trg_lock_pool() returns trigger language plpgsql set search_path = public as $$
begin
  if old.status <> 'draft' and (new.price is distinct from old.price or new.unit is distinct from old.unit
     or new.product_id is distinct from old.product_id or new.min_qty is distinct from old.min_qty
     or new.reference_price is distinct from old.reference_price or new.max_per_customer is distinct from old.max_per_customer) then
    raise exception 'Commercial terms are locked after publication. Cancel and create a revised deal.';
  end if;
  new.updated_at = now();
  return new;
end $$;

create or replace function public.finalise_funding(_pool uuid) returns text language plpgsql security definer set search_path = public as $$
declare p public.pools; o record; pname text;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'awaiting_confirmation' then return p.status; end if;
  select name into pname from public.products where id = p.product_id;
  -- expire anything not fully paid
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
  else
    update public.pools set status = case when p.paid_qty > 0 then 'refund_resolution' else 'unsuccessful' end,
      outcome_note = 'Paid quantity (' || p.paid_qty || ') below minimum (' || p.min_qty || ') at payment deadline.' where id = _pool;
    for o in select * from public.orders where pool_id = _pool and payment_status = 'paid' loop
      update public.orders set status = 'failed', failure_reason = 'Pool was not fully funded' where id = o.id;
      insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Pool not funded: full refund due');
      perform public.notify(o.user_id, 'Deal unsuccessful: refund due', 'The ' || pname || ' pool was not fully funded. Your payment will be refunded.', '/orders/' || o.id);
    end loop;
    return 'failed';
  end if;
end $$;

create or replace function public.admin_cancel_pool(_pool uuid, _reason text) returns void language plpgsql security definer set search_path = public as $$
declare o record; pt record;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.pools set status = 'cancelled', outcome_note = _reason, closed_at = now() where id = _pool and status in ('draft','scheduled','open','awaiting_confirmation');
  if not found then raise exception 'This pool cannot be cancelled at its current stage'; end if;
  for pt in select * from public.participations where pool_id = _pool and status = 'active' loop
    perform public.notify(pt.user_id, 'Deal cancelled', coalesce(_reason,'This deal was cancelled.') || ' No payment is required.', '/my-pools');
  end loop;
  for o in select * from public.orders where pool_id = _pool and status in ('awaiting_confirmation','confirmed') loop
    update public.orders set status = 'cancelled', failure_reason = _reason, payment_status = case when amount_paid > 0 then payment_status else 'not_due' end where id = o.id;
    if o.amount_paid > 0 then insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Deal cancelled'); end if;
    perform public.notify(o.user_id, 'Deal cancelled', coalesce(_reason,'This deal was cancelled.'), '/orders/' || o.id);
  end loop;
  perform public.audit('cancel_pool','pool',_pool, jsonb_build_object('reason',_reason));
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
      perform public.notify(part.user_id, 'Deal unsuccessful',
        'The ' || pname || ' pool did not reach its target. No payment is required.', '/my-pools');
    end loop;
  end if;
end $$;

create or replace function public.join_pool(_pool uuid, _qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.pools; b public.businesses; existing public.participations; others int; cp public.collection_points; km double precision;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then raise exception 'Please complete your business profile first'; end if;
  perform public.refresh_pool_states();
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Deal not found'; end if;
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

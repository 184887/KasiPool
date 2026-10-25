-- Plain English (2026-10-25): KasiPool's shop owners are often not native English speakers, so
-- the notifications and error messages shops see are rewritten in short, everyday words, and
-- quantities read "10 bags" instead of "10 bag(s)". Each function below is its latest
-- definition with only the message text changed.

-- "10 bags", "1 carton", "2 boxes" (matches plural() in src/lib/format.ts)
create or replace function private.qty_text(_n int, _unit text) returns text
language sql immutable set search_path = public as $$
  select _n || ' ' || case
    when _n = 1 or coalesce(_unit, '') = '' then coalesce(_unit, '')
    when _unit ~* '(s|x|z|ch|sh)$' then _unit || 'es'
    else _unit || 's' end
$$;

CREATE OR REPLACE FUNCTION public.admin_cancel_pool(_pool uuid, _reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o record; pt record;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.pools set status = 'cancelled', outcome_note = _reason, closed_at = now() where id = _pool and status in ('draft','scheduled','open','awaiting_confirmation');
  if not found then raise exception 'This pool cannot be cancelled at its current stage'; end if;
  for pt in select * from public.participations where pool_id = _pool and status = 'active' loop
    perform public.notify(pt.user_id, 'Deal cancelled', coalesce(_reason,'We cancelled this deal.') || ' You do not need to pay.', '/my-pools');
  end loop;
  for o in select * from public.orders where pool_id = _pool and status in ('awaiting_confirmation','confirmed') loop
    update public.orders set status = 'cancelled', failure_reason = _reason, payment_status = case when amount_paid > 0 then payment_status else 'not_due' end where id = o.id;
    if o.amount_paid > 0 then insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Deal cancelled'); end if;
    perform public.notify(o.user_id, 'Deal cancelled', coalesce(_reason,'We cancelled this deal.') || ' If you paid, we will pay you back.', '/orders/' || o.id);
  end loop;
  perform public.audit('cancel_pool','pool',_pool, jsonb_build_object('reason',_reason));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_complete_refund(_refund uuid, _reference text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.refunds; outstanding numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.refunds set status = 'completed', completed_reference = _reference, completed_at = now(), recorded_by = auth.uid()
    where id = _refund and status = 'owed' returning * into r;
  if r.id is null then raise exception 'Refund already completed or not found'; end if;
  select coalesce(sum(amount),0) into outstanding from public.refunds where order_id = r.order_id and status = 'owed';
  if outstanding = 0 then
    update public.orders set payment_status = 'refunded' where id = r.order_id and status in ('failed','expired','cancelled') and amount_paid > 0;
  end if;
  perform public.notify((select user_id from public.orders where id = r.order_id), 'Money paid back', 'We paid back R' || r.amount || ' to you.', '/orders/' || r.order_id);
  perform public.audit('refund_completed','refund',_refund, jsonb_build_object('reference',_reference,'amount',r.amount));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_dispatch_pool(_pool uuid, _courier_ref text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o record; n int := 0; pname text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if (select status from public.pools where id = _pool) <> 'stock_received' then raise exception 'Record stock receipt first'; end if;
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  for o in select * from public.orders where pool_id = _pool and fulfilment_status in ('allocated','short') and allocated_qty > 0 loop
    update public.orders set fulfilment_status = 'out_for_delivery', out_for_delivery_at = now(),
      courier_ref = nullif(trim(_courier_ref), '') where id = o.id;
    perform public.notify(o.user_id, 'Out for delivery',
      'Your ' || pname || ' is on the way to ' || coalesce(o.delivery_address, 'your shop') || '.', '/orders/' || o.id);
    n := n + 1;
  end loop;
  update public.pools set status = 'out_for_delivery' where id = _pool;
  perform public.complete_pool_if_delivered(_pool);
  perform public.audit('dispatch_pool','pool',_pool, jsonb_build_object('orders',n,'courier_ref',_courier_ref));
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_flag_payment_issue(_order uuid, _note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.orders set payment_status = 'issue' where id = _order and status = 'confirmed' and payment_status <> 'paid' returning * into o;
  if o.id is null then raise exception 'Cannot flag this order'; end if;
  perform public.notify(o.user_id, 'Payment problem', coalesce(_note,'There is a problem with your payment. Please contact KasiPool.'), '/orders/' || _order);
  perform public.audit('payment_issue','order',_order, jsonb_build_object('note',_note));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_mark_delivered(_order uuid, _note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.orders set fulfilment_status = 'delivered', delivered_at = now()
    where id = _order and fulfilment_status = 'out_for_delivery' returning * into o;
  if o.id is null then raise exception 'This order is not on the way yet'; end if;
  perform public.notify(o.user_id, 'Delivered', 'The courier says they delivered order ' || o.ref || '. Did you get it? Please tell us in the app.', '/orders/' || _order);
  perform public.audit('mark_delivered','order',_order, jsonb_build_object('note',_note));
  perform public.complete_pool_if_delivered(o.pool_id);
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_receive_stock(_pool uuid, _received integer, _note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare po public.purchase_orders; remaining int; o record; give int; pname text; owed numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into po from public.purchase_orders where pool_id = _pool for update;
  if po.id is null or po.status <> 'ordered' then raise exception 'No open purchase order for this pool'; end if;
  if _received < 0 then raise exception 'Invalid quantity'; end if;
  update public.purchase_orders set received_qty = _received, discrepancy_note = _note, received_at = now(),
    status = case when _received >= po.quantity then 'received' else 'partially_received' end where id = po.id;
  remaining := _received;
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  for o in select * from public.orders where pool_id = _pool and status = 'confirmed' and payment_status = 'paid' order by paid_at nulls last, confirmed_at loop
    give := least(o.quantity, remaining);
    remaining := remaining - give;
    update public.orders set allocated_qty = give, fulfilment_status = case when give >= o.quantity then 'allocated' else 'short' end where id = o.id;
    if give < o.quantity then
      owed := (o.quantity - give) * o.unit_price + case when give = 0 then o.delivery_fee else 0 end;
      insert into public.refunds(order_id, amount, reason) values (o.id, owed, 'Supplier short delivery: ' || (o.quantity - give) || ' unit(s) not received');
      perform public.notify(o.user_id, 'Some stock is missing', 'The supplier did not send all the ' || pname || '. We will pay you back for what is missing.', '/orders/' || o.id);
    end if;
  end loop;
  update public.pools set status = 'stock_received' where id = _pool;
  perform public.audit('receive_stock','pool',_pool, jsonb_build_object('received',_received,'ordered',po.quantity,'note',_note));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_record_payment(_order uuid, _amount numeric, _channel_ref text, _note text, _kind text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.orders; newpaid numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into o from public.orders where id = _order for update;
  if o.status <> 'confirmed' then raise exception 'Payments can only be recorded on confirmed orders'; end if;
  if o.payment_status = 'paid' then raise exception 'This order is already fully paid'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Enter a positive amount'; end if;
  insert into public.payments(order_id, amount, kind, channel_reference, note, recorded_by) values (_order, _amount, _kind, _channel_ref, _note, auth.uid());
  if _kind = 'verified' then
    newpaid := o.amount_paid + _amount;
    update public.orders set amount_paid = newpaid,
      payment_status = case when newpaid >= o.total then 'paid' else 'under_review' end,
      paid_at = case when newpaid >= o.total then now() else null end where id = _order;
    if newpaid >= o.total then
      perform public.notify(o.user_id, 'Payment received', 'We got your payment for order ' || o.ref || '. Thank you.', '/orders/' || _order);
      if newpaid > o.total then insert into public.refunds(order_id, amount, reason) values (_order, newpaid - o.total, 'Overpayment'); end if;
    end if;
  else
    update public.orders set payment_status = 'under_review' where id = _order;
  end if;
  perform public.audit('record_payment','order',_order, jsonb_build_object('amount',_amount,'kind',_kind,'ref',_channel_ref,'note',_note));
end $function$
;

CREATE OR REPLACE FUNCTION public.admin_resolve_delivery_problem(_order uuid, _note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.orders set problem_note = null, problem_reported_at = null
    where id = _order and problem_reported_at is not null returning * into o;
  if o.id is null then raise exception 'No open problem on this order'; end if;
  perform public.notify(o.user_id, 'Problem fixed', coalesce(nullif(btrim(_note), ''), 'KasiPool fixed the problem you told us about.'), '/orders/' || _order);
  perform public.audit('resolve_delivery_problem','order',_order, jsonb_build_object('note',_note));
end $function$
;

CREATE OR REPLACE FUNCTION public.check_delivery_zone(_pool uuid, _b businesses)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare z uuid; zname text;
begin
  select zone_id into z from private.business_delivery(_b);
  if z is null then
    raise exception 'Please add your address and area in your profile first';
  end if;
  if exists (select 1 from public.pool_zones where pool_id = _pool)
     and not exists (select 1 from public.pool_zones where pool_id = _pool and zone_id = z) then
    select name into zname from public.delivery_zones where id = z;
    raise exception 'We don''t deliver this deal to % yet', zname;
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.claim_pool_invite(_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pid uuid;
begin
  if auth.uid() is null then raise exception 'Please log in first'; end if;
  select id into pid from public.pools where invite_code = upper(trim(_code)) and is_private and status <> 'draft';
  if pid is null then raise exception 'We can''t find this code, or it is too old'; end if;
  insert into public.pool_members(pool_id, user_id) values (pid, auth.uid()) on conflict do nothing;
  return pid;
end $function$
;

CREATE OR REPLACE FUNCTION public.close_pool(_pool uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      perform public.notify(part.user_id, 'The pool is full: please confirm',
        'The ' || pname || ' pool is full. Please confirm your order and pay before the deadline.', '/my-pools');
    end loop;
  else
    perform public.fail_pool(_pool, 'Minimum target not reached by the closing time.');
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.confirm_delivery_received(_order uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.orders;
begin
  update public.orders set fulfilment_status = 'received', received_at = now(),
      delivered_at = coalesce(delivered_at, now())
    where id = _order and user_id = auth.uid() and fulfilment_status in ('out_for_delivery','delivered')
    returning * into o;
  if o.id is null then raise exception 'This order is not on the way yet'; end if;
  perform public.notify(o.user_id, 'Order done', 'Thank you. Order ' || o.ref || ' is done.', '/orders/' || _order);
  perform public.audit('confirm_received','order',_order);
  perform public.complete_pool_if_delivered(o.pool_id);
end $function$
;

CREATE OR REPLACE FUNCTION public.confirm_order(_order uuid, _accept boolean)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.orders; p public.pools; b public.businesses; tv text; reference text;
begin
  select * into o from public.orders where id = _order and user_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'awaiting_confirmation' then raise exception 'You can''t confirm this order any more'; end if;
  select * into p from public.pools where id = o.pool_id;
  if p.status <> 'awaiting_confirmation' or p.payment_deadline <= now() then raise exception 'The time to confirm is over'; end if;
  if not _accept then raise exception 'Please tick the box to accept the terms'; end if;
  -- Re-check the delivery address in case the shop changed it since joining
  select * into b from public.businesses where id = o.business_id;
  perform public.check_delivery_zone(o.pool_id, b);
  perform public.set_order_delivery(_order);
  select value->>'version' into tv from public.app_settings where key = 'terms';
  reference := 'KP-' || to_char(now() at time zone 'Africa/Johannesburg','YYMM') || '-' || nextval('public.order_ref_seq');
  update public.orders set status = 'confirmed', confirmed_at = now(), terms_version = coalesce(tv,'v0.1-draft'),
    ref = reference, payment_reference = reference, payment_status = 'awaiting_payment' where id = _order;
  perform public.notify(auth.uid(), 'Please pay now', 'Order ' || reference || ' is confirmed. Please pay before the deadline. Use ' || reference || ' as the reference.', '/orders/' || _order);
  return reference;
end $function$
;

CREATE OR REPLACE FUNCTION public.decline_order(_order uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.orders set status = 'declined', declined_at = now() where id = _order and user_id = auth.uid() and status = 'awaiting_confirmation';
  if not found then raise exception 'You can''t cancel this order'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.fail_pool(_pool uuid, _note text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o record; part record; pname text; any_paid boolean;
begin
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  select exists(select 1 from public.orders where pool_id = _pool and payment_status = 'paid' and status = 'confirmed') into any_paid;
  for o in select * from public.orders where pool_id = _pool and status = 'confirmed' and payment_status = 'paid' loop
    update public.orders set status = 'failed', failure_reason = 'Pool was not fully funded' where id = o.id;
    insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Pool not funded: full refund due');
    perform public.notify(o.user_id, 'Deal failed: we will pay you back', 'Not enough shops paid for the ' || pname || ' pool. We will pay back your money.', '/orders/' || o.id);
  end loop;
  for part in select * from public.participations where pool_id = _pool and status = 'active' loop
    perform public.notify(part.user_id, 'Deal failed', 'Not enough shops joined the ' || pname || ' pool. You do not need to pay.', '/my-pools');
  end loop;
  update public.pools set status = case when any_paid then 'refund_resolution' else 'unsuccessful' end,
    closed_at = coalesce(closed_at, now()), payment_deadline = null, outcome_note = _note where id = _pool;
  perform public.recalc_pool(_pool);
  return 'failed';
end $function$
;

CREATE OR REPLACE FUNCTION public.finalise_funding(_pool uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    perform public.notify(o.user_id, 'Order closed', 'You did not pay for your ' || pname || ' order in time, so it is closed.', '/orders/' || o.id);
  end loop;
  perform public.recalc_pool(_pool);
  select * into p from public.pools where id = _pool;
  if p.paid_qty >= p.min_qty then
    update public.pools set status = 'funded', outcome_note = null where id = _pool;
    for o in select * from public.orders where pool_id = _pool and payment_status = 'paid' loop
      perform public.notify(o.user_id, 'We are ordering your stock', 'Enough shops paid for the ' || pname || ' pool. We are ordering the stock now.', '/orders/' || o.id);
    end loop;
    return 'funded';
  end if;
  if now() < p.closes_at then
    -- Reopen for the gap until the original closing time
    update public.pools set status = 'open', payment_deadline = null, reopened_at = now(),
      outcome_note = 'Reopened: ' || (p.min_qty - p.paid_qty) || ' more ' || p.unit || '(s) needed by the closing time.'
      where id = _pool;
    for o in select * from public.orders where pool_id = _pool and payment_status = 'paid' and status = 'confirmed' loop
      perform public.notify(o.user_id, 'The deal is open again',
        'Some shops did not pay, so the ' || pname || ' deal is open again. It needs '
        || private.qty_text(p.min_qty - p.paid_qty, p.unit)
        || ' more. Your order is safe. If the pool does not fill up by the closing date, we will pay you back.',
        '/orders/' || o.id);
    end loop;
    perform public.audit('reopen_pool', 'pool', _pool, jsonb_build_object('paid_qty', p.paid_qty, 'min_qty', p.min_qty));
    return 'reopened';
  end if;
  return public.fail_pool(_pool, 'Paid quantity (' || p.paid_qty || ') below minimum (' || p.min_qty || ') at the payment deadline.');
end $function$
;

CREATE OR REPLACE FUNCTION public.join_pool(_pool uuid, _qty integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.pools; b public.businesses; existing public.participations; others int; prior public.orders;
begin
  if auth.uid() is null then raise exception 'Please log in first'; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then raise exception 'Please add your shop details first'; end if;
  perform public.refresh_pool_states();
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Deal not found'; end if;
  if p.is_sample then raise exception 'This is a sample deal. You can''t join it.'; end if;
  if p.is_private and not exists(select 1 from public.pool_members where pool_id = _pool and user_id = auth.uid()) then
    raise exception 'This is a private group. Type its code to join.';
  end if;
  if p.status <> 'open' or p.closes_at <= now() then raise exception 'This pool is closed'; end if;
  -- A shop gets one order per pool: it can't rejoin a reopened pool it already ordered from
  select * into prior from public.orders where pool_id = _pool and user_id = auth.uid() order by created_at desc limit 1;
  if prior.id is not null then
    if prior.status = 'confirmed' then raise exception 'You already have an order in this deal'; end if;
    raise exception 'You did not pay for your last order in this deal, so you can''t join it again';
  end if;
  if _qty is null or _qty < p.min_per_customer then raise exception 'You must order at least %', p.min_per_customer; end if;
  if p.max_per_customer is not null and _qty > p.max_per_customer then raise exception 'You can order at most %', p.max_per_customer; end if;
  perform public.check_delivery_zone(_pool, b);
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
end $function$
;

CREATE OR REPLACE FUNCTION public.propose_pool(_product uuid, _unit text, _min_qty integer, _max_qty integer, _min_per integer, _max_per integer, _opens timestamp with time zone, _closes timestamp with time zone, _note text, _private boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pid uuid; uid uuid := auth.uid(); b public.businesses; z uuid;
begin
  if uid is null then raise exception 'Please log in first'; end if;
  select * into b from public.businesses where user_id = uid;
  if b.id is null then raise exception 'Please add your shop details first'; end if;
  select zone_id into z from private.business_delivery(b);
  if z is null then raise exception 'Please add your address and area in your profile first'; end if;
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
  insert into public.pool_zones(pool_id, zone_id) values (pid, z);
  if coalesce(_private,false) then insert into public.pool_members(pool_id, user_id) values (pid, uid); end if;
  perform public.audit('propose_pool','pool',pid);
  return pid;
end $function$
;

CREATE OR REPLACE FUNCTION public.report_delivery_problem(_order uuid, _note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.orders;
begin
  if coalesce(btrim(_note), '') = '' then raise exception 'Tell us what went wrong'; end if;
  update public.orders set problem_note = btrim(_note), problem_reported_at = now()
    where id = _order and user_id = auth.uid() and fulfilment_status in ('out_for_delivery','delivered','received')
    returning * into o;
  if o.id is null then raise exception 'You can tell us about a problem when your order is on the way'; end if;
  perform public.notify_admins('Delivery problem', 'Order ' || o.ref || ': ' || btrim(_note), '/admin/deliveries');
  perform public.audit('delivery_problem','order',_order, jsonb_build_object('note',_note));
end $function$
;

CREATE OR REPLACE FUNCTION public.withdraw_from_pool(_pool uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.pools;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'open' then raise exception 'You can only leave a pool while it is open'; end if;
  update public.participations set status = 'withdrawn', updated_at = now() where pool_id = _pool and user_id = auth.uid() and status = 'active';
  perform public.recalc_pool(_pool);
end $function$
;

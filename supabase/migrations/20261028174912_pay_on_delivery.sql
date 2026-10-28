-- Pilot payments (2026-10-28): KasiPool buys the stock with its own money and shops pay when it
-- arrives, either in cash at the door or by EFT. EFT shops upload proof of payment whenever they
-- are ready; it only counts as paid once an admin finds the money in the bank and approves it.
-- A pool now goes ahead once enough shops CONFIRM (not pay), and the deadline is for confirming.

-- ===== How each order is paid =====
alter table public.orders add column payment_method text
  check (payment_method in ('cash', 'eft'));
update public.orders set payment_method = 'eft' where status = 'confirmed';
alter table public.payments add column method text not null default 'eft'
  check (method in ('eft', 'cash'));

-- ===== Proof of payment (separate from payments: a proof is a claim, a payment is verified) =====
create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  file_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'replaced')),
  note text,
  uploaded_by uuid not null,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now());
create index on public.payment_proofs(order_id);
create index on public.payment_proofs(status) where status = 'pending';
alter table public.payment_proofs enable row level security;
create policy "own or admin read proofs" on public.payment_proofs for select to authenticated
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
grant select on public.payment_proofs to authenticated;

-- Private bucket: each shop uploads into its own folder (<user id>/...), admins can read all
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;
create policy "shops upload own payment proofs" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own or admin read payment proofs" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ===== Confirming: choose how to pay =====
drop function public.confirm_order(uuid, boolean);
create function public.confirm_order(_order uuid, _accept boolean, _method text default null)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare o public.orders; p public.pools; b public.businesses; tv text; reference text;
begin
  select * into o from public.orders where id = _order and user_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'awaiting_confirmation' then raise exception 'You can''t confirm this order any more'; end if;
  select * into p from public.pools where id = o.pool_id;
  if p.status <> 'awaiting_confirmation' or p.payment_deadline <= now() then raise exception 'The time to confirm is over'; end if;
  if not _accept then raise exception 'Please tick the box to accept the terms'; end if;
  if _method is null or _method not in ('cash', 'eft') then raise exception 'Choose how you will pay'; end if;
  -- Re-check the delivery address in case the business changed it since joining
  select * into b from public.businesses where id = o.business_id;
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
      else 'Order ' || reference || ' is confirmed. Pay by EFT with reference ' || reference || ', then upload your proof of payment.'
    end, '/orders/' || _order);
  perform public.recalc_pool(o.pool_id);
  return reference;
end $function$;
revoke execute on function public.confirm_order(uuid, boolean, text) from public, anon;
grant execute on function public.confirm_order(uuid, boolean, text) to authenticated;

create or replace function public.choose_payment_method(_order uuid, _method text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if _method is null or _method not in ('cash', 'eft') then raise exception 'Choose how you will pay'; end if;
  select * into o from public.orders where id = _order and user_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'confirmed' or o.payment_status in ('paid', 'refunded', 'expired') then
    raise exception 'You can''t change how you pay for this order';
  end if;
  if o.payment_status = 'under_review' then raise exception 'We are checking your proof of payment. Please wait.'; end if;
  update public.orders set payment_method = _method where id = _order;
  perform public.audit('choose_payment_method', 'order', _order, jsonb_build_object('method', _method));
end $$;
revoke execute on function public.choose_payment_method(uuid, text) from public, anon;
grant execute on function public.choose_payment_method(uuid, text) to authenticated;

-- ===== Proof of payment =====
create or replace function public.submit_payment_proof(_order uuid, _path text) returns uuid
language plpgsql security definer set search_path = public as $$
declare o public.orders; pid uuid;
begin
  select * into o from public.orders where id = _order and user_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'confirmed' or o.payment_status in ('paid', 'refunded', 'expired') then
    raise exception 'This order doesn''t need a proof of payment';
  end if;
  if _path is null or split_part(_path, '/', 1) <> auth.uid()::text
     or not exists (select 1 from storage.objects where bucket_id = 'payment-proofs' and name = _path) then
    raise exception 'Please upload your proof of payment again';
  end if;
  -- A new upload replaces one still waiting (e.g. the shop sent the wrong picture)
  update public.payment_proofs set status = 'replaced' where order_id = _order and status = 'pending';
  insert into public.payment_proofs (order_id, file_path, uploaded_by) values (_order, _path, auth.uid())
    returning id into pid;
  update public.orders set payment_status = 'under_review', payment_method = 'eft' where id = _order;
  perform public.notify_admins('Proof of payment to check',
    'Order ' || o.ref || ' sent a proof of payment. Check it against the bank account.', '/admin/payments');
  perform public.audit('submit_payment_proof', 'order', _order, jsonb_build_object('proof', pid));
  return pid;
end $$;
revoke execute on function public.submit_payment_proof(uuid, text) from public, anon;
grant execute on function public.submit_payment_proof(uuid, text) to authenticated;

-- Recording a payment: now says how it was paid (EFT or cash). A part payment leaves the order
-- waiting for the rest; a full one closes any proofs still waiting.
drop function public.admin_record_payment(uuid, numeric, text, text, text);
create function public.admin_record_payment(_order uuid, _amount numeric, _channel_ref text, _note text,
  _kind text, _method text default 'eft')
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare o public.orders; newpaid numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into o from public.orders where id = _order for update;
  if o.status <> 'confirmed' then raise exception 'Payments can only be recorded on confirmed orders'; end if;
  if o.payment_status = 'paid' then raise exception 'This order is already fully paid'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Enter a positive amount'; end if;
  if coalesce(_method, 'eft') not in ('eft', 'cash') then raise exception 'Choose EFT or cash'; end if;
  insert into public.payments(order_id, amount, kind, channel_reference, note, recorded_by, method)
    values (_order, _amount, _kind, _channel_ref, _note, auth.uid(), coalesce(_method, 'eft'));
  if _kind = 'verified' then
    newpaid := o.amount_paid + _amount;
    update public.orders set amount_paid = newpaid,
      payment_status = case when newpaid >= o.total then 'paid' else 'awaiting_payment' end,
      paid_at = case when newpaid >= o.total then now() else null end where id = _order;
    if newpaid >= o.total then
      update public.payment_proofs set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
        where order_id = _order and status = 'pending';
      perform public.notify(o.user_id, 'Payment received', 'We got your payment for order ' || o.ref || '. Thank you.', '/orders/' || _order);
      if newpaid > o.total then insert into public.refunds(order_id, amount, reason) values (_order, newpaid - o.total, 'Overpayment'); end if;
    else
      perform public.notify(o.user_id, 'Part payment received',
        'We got R' || to_char(_amount, 'FM999999990.00') || ' for order ' || o.ref || '. You still owe R'
        || to_char(o.total - newpaid, 'FM999999990.00') || '.', '/orders/' || _order);
    end if;
  else
    update public.orders set payment_status = 'under_review' where id = _order;
  end if;
  perform public.recalc_pool(o.pool_id);
  perform public.audit('record_payment','order',_order,
    jsonb_build_object('amount',_amount,'kind',_kind,'method',coalesce(_method, 'eft'),'ref',_channel_ref,'note',_note));
end $function$;
revoke execute on function public.admin_record_payment(uuid, numeric, text, text, text, text) from public, anon;
grant execute on function public.admin_record_payment(uuid, numeric, text, text, text, text) to authenticated;

create or replace function public.admin_review_payment_proof(_proof uuid, _approve boolean,
  _amount numeric default null, _note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare pr public.payment_proofs; o public.orders;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into pr from public.payment_proofs where id = _proof for update;
  if pr.id is null then raise exception 'Proof not found'; end if;
  if pr.status <> 'pending' then raise exception 'This proof has already been checked'; end if;
  select * into o from public.orders where id = pr.order_id;
  if _approve then
    if _amount is null or _amount <= 0 then raise exception 'Enter the amount you found in the bank account'; end if;
    update public.payment_proofs set status = 'approved', note = nullif(btrim(_note), ''),
      reviewed_by = auth.uid(), reviewed_at = now() where id = _proof;
    perform public.admin_record_payment(o.id, _amount, 'Proof of payment', _note, 'verified', 'eft');
  else
    if nullif(btrim(_note), '') is null then raise exception 'Say why, so the shop can fix it'; end if;
    update public.payment_proofs set status = 'rejected', note = btrim(_note),
      reviewed_by = auth.uid(), reviewed_at = now() where id = _proof;
    update public.orders set payment_status = 'awaiting_payment'
      where id = o.id and payment_status = 'under_review';
    perform public.notify(o.user_id, 'We could not find your payment',
      'Your proof of payment for order ' || o.ref || ' was not accepted: ' || btrim(_note)
      || '. Please check it and upload it again.', '/orders/' || o.id);
  end if;
  perform public.audit(case when _approve then 'approve_payment_proof' else 'reject_payment_proof' end,
    'order', o.id, jsonb_build_object('proof', _proof, 'amount', _amount, 'note', _note));
end $$;
revoke execute on function public.admin_review_payment_proof(uuid, boolean, numeric, text) from public, anon;
grant execute on function public.admin_review_payment_proof(uuid, boolean, numeric, text) to authenticated;

-- ===== Lifecycle: confirmed orders fund the pool =====
create or replace function public.close_pool(_pool uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare p public.pools; part record; pname text; oid uuid;
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
      perform public.notify(part.user_id, 'The pool is full: please confirm',
        'The ' || pname || ' pool is full. Please confirm your order before the deadline. You pay when your stock arrives.', '/my-pools');
    end loop;
  else
    perform public.fail_pool(_pool, 'Minimum target not reached by the closing time.');
  end if;
end $function$;

-- Every confirmed order fails with the pool; only shops that already paid get money back
create or replace function public.fail_pool(_pool uuid, _note text)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare o record; part record; pname text; any_paid boolean;
begin
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  select exists(select 1 from public.orders where pool_id = _pool and status = 'confirmed' and amount_paid > 0) into any_paid;
  for o in select * from public.orders where pool_id = _pool and status = 'confirmed' loop
    update public.orders set status = 'failed', failure_reason = 'Not enough shops confirmed',
      payment_status = case when amount_paid > 0 then payment_status else 'not_due' end where id = o.id;
    if o.amount_paid > 0 then
      insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Deal failed: full refund due');
      perform public.notify(o.user_id, 'Deal failed: we will pay you back', 'Not enough shops confirmed for the ' || pname || ' pool. We will pay back your money.', '/orders/' || o.id);
    else
      perform public.notify(o.user_id, 'Deal failed', 'Not enough shops confirmed for the ' || pname || ' pool. You do not need to pay.', '/orders/' || o.id);
    end if;
  end loop;
  for part in select * from public.participations where pool_id = _pool and status = 'active' loop
    perform public.notify(part.user_id, 'Deal failed', 'Not enough shops joined the ' || pname || ' pool. You do not need to pay.', '/my-pools');
  end loop;
  update public.pools set status = case when any_paid then 'refund_resolution' else 'unsuccessful' end,
    closed_at = coalesce(closed_at, now()), payment_deadline = null, outcome_note = _note where id = _pool;
  perform public.recalc_pool(_pool);
  return 'failed';
end $function$;

create or replace function public.finalise_funding(_pool uuid)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare p public.pools; o record; pname text;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'awaiting_confirmation' then return p.status; end if;
  select name into pname from public.products where id = p.product_id;
  -- Close orders nobody confirmed. Confirmed orders stay, paid or not.
  for o in select * from public.orders where pool_id = _pool and status = 'awaiting_confirmation' loop
    update public.orders set status = 'expired', payment_status = 'expired',
      failure_reason = 'Not confirmed before the deadline' where id = o.id;
    perform public.notify(o.user_id, 'Order closed', 'You did not confirm your ' || pname || ' order in time, so it is closed.', '/orders/' || o.id);
  end loop;
  perform public.recalc_pool(_pool);
  select * into p from public.pools where id = _pool;
  if p.confirmed_qty >= p.min_qty then
    update public.pools set status = 'funded', outcome_note = null where id = _pool;
    for o in select * from public.orders where pool_id = _pool and status = 'confirmed' loop
      perform public.notify(o.user_id, 'We are ordering your stock', 'Enough shops confirmed for the ' || pname || ' pool. We are ordering the stock now. You pay when it arrives.', '/orders/' || o.id);
    end loop;
    return 'funded';
  end if;
  if now() < p.closes_at then
    -- Reopen for the gap until the original closing time
    update public.pools set status = 'open', payment_deadline = null, reopened_at = now(),
      outcome_note = 'Reopened: ' || (p.min_qty - p.confirmed_qty) || ' more ' || p.unit || '(s) needed by the closing time.'
      where id = _pool;
    for o in select * from public.orders where pool_id = _pool and status = 'confirmed' loop
      perform public.notify(o.user_id, 'The deal is open again',
        'Some shops did not confirm, so the ' || pname || ' deal is open again. It needs '
        || private.qty_text(p.min_qty - p.confirmed_qty, p.unit)
        || ' more. Your order is safe. If the pool does not fill up by the closing date, it is cancelled.',
        '/orders/' || o.id);
    end loop;
    perform public.audit('reopen_pool', 'pool', _pool, jsonb_build_object('confirmed_qty', p.confirmed_qty, 'min_qty', p.min_qty));
    return 'reopened';
  end if;
  return public.fail_pool(_pool, 'Confirmed quantity (' || p.confirmed_qty || ') below minimum (' || p.min_qty || ') at the deadline.');
end $function$;

create or replace function public.admin_finalise_funding(_pool uuid)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare res text; p public.pools;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool;
  if p.confirmed_qty < p.min_qty and p.payment_deadline > now() then
    raise exception 'Confirmed quantity is below the minimum. Wait for more shops to confirm or the deadline.';
  end if;
  res := public.finalise_funding(_pool);
  perform public.audit('finalise_funding','pool',_pool, jsonb_build_object('result',res));
  return res;
end $function$;

-- KasiPool buys stock for every confirmed order (pilot: shops pay on delivery)
create or replace function public.admin_create_po(_pool uuid, _supplier_ref text, _order_date date, _expected date)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare p public.pools; c numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'funded' then raise exception 'Only funded pools can be procured'; end if;
  if p.confirmed_qty < p.min_qty then raise exception 'Confirmed quantity is below the minimum'; end if;
  select supplier_cost into c from public.pool_costs where pool_id = _pool;
  insert into public.purchase_orders(pool_id, supplier_id, quantity, unit_cost, total, supplier_ref, order_date, expected_date, created_by)
  values (_pool, p.supplier_id, p.confirmed_qty, coalesce(c,0), coalesce(c,0) * p.confirmed_qty, _supplier_ref, coalesce(_order_date, current_date), _expected, auth.uid());
  update public.pools set status = 'procurement' where id = _pool;
  update public.orders set fulfilment_status = 'ordered' where pool_id = _pool and status = 'confirmed';
  perform public.audit('create_purchase_order','pool',_pool, jsonb_build_object('qty',p.confirmed_qty,'supplier_ref',_supplier_ref));
end $function$;

-- Short delivery: the order total drops to what the shop gets. Only money already paid above the
-- new total is refunded.
create or replace function public.admin_receive_stock(_pool uuid, _received integer, _note text)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare po public.purchase_orders; remaining int; o record; give int; pname text; newtotal numeric; owed numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into po from public.purchase_orders where pool_id = _pool for update;
  if po.id is null or po.status <> 'ordered' then raise exception 'No open purchase order for this pool'; end if;
  if _received < 0 then raise exception 'Invalid quantity'; end if;
  update public.purchase_orders set received_qty = _received, discrepancy_note = _note, received_at = now(),
    status = case when _received >= po.quantity then 'received' else 'partially_received' end where id = po.id;
  remaining := _received;
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  for o in select * from public.orders where pool_id = _pool and status = 'confirmed'
      order by paid_at nulls last, confirmed_at loop
    give := least(o.quantity, remaining);
    remaining := remaining - give;
    update public.orders set allocated_qty = give, fulfilment_status = case when give >= o.quantity then 'allocated' else 'short' end where id = o.id;
    if give < o.quantity then
      newtotal := give * o.unit_price + case when give > 0 then o.delivery_fee else 0 end;
      owed := greatest(o.amount_paid - newtotal, 0);
      update public.orders set total = newtotal,
        payment_status = case
          when o.amount_paid > 0 and o.amount_paid >= newtotal then 'paid'
          when newtotal = 0 then 'not_due'
          else payment_status end,
        paid_at = case when o.amount_paid > 0 and o.amount_paid >= newtotal then coalesce(paid_at, now()) else paid_at end
        where id = o.id;
      if owed > 0 then
        insert into public.refunds(order_id, amount, reason) values (o.id, owed, 'Supplier short delivery: ' || (o.quantity - give) || ' unit(s) not received');
      end if;
      perform public.notify(o.user_id, 'Some stock is missing',
        'The supplier did not send all the ' || pname || '. You only pay for what you get'
        || case when owed > 0 then ', and we will pay back the difference.' else '.' end, '/orders/' || o.id);
    end if;
  end loop;
  update public.pools set status = 'stock_received' where id = _pool;
  perform public.recalc_pool(_pool);
  perform public.audit('receive_stock','pool',_pool, jsonb_build_object('received',_received,'ordered',po.quantity,'note',_note));
end $function$;

-- Latest join_pool (20261026130322); an expired order now means it was never confirmed
create or replace function public.join_pool(_pool uuid, _qty int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.pools; b public.businesses; existing public.participations; others int; prior public.orders;
begin
  if auth.uid() is null then raise exception 'Please log in first'; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then raise exception 'Please add your business details first'; end if;
  perform public.refresh_pool_states();
  select * into p from public.pools where id = _pool for update;
  if p.id is null or (p.is_test and not b.is_test) then raise exception 'Deal not found'; end if;
  if b.is_test and not p.is_test then raise exception 'Test shops can only join test pools.'; end if;
  if p.is_sample then raise exception 'This is a sample deal. You can''t join it.'; end if;
  if p.is_private and not exists(select 1 from public.pool_members where pool_id = _pool and user_id = auth.uid()) then
    raise exception 'This is a private group. Type its code to join.';
  end if;
  if p.status <> 'open' or p.closes_at <= now() then raise exception 'This pool is closed'; end if;
  select * into prior from public.orders where pool_id = _pool and user_id = auth.uid() order by created_at desc limit 1;
  if prior.id is not null then
    if prior.status = 'confirmed' then raise exception 'You already have an order in this deal'; end if;
    raise exception 'You did not confirm your last order in this deal, so you can''t join it again';
  end if;
  if _qty is null or _qty < p.min_per_customer then raise exception 'You must order at least %', p.min_per_customer; end if;
  if p.max_per_customer is not null and _qty > p.max_per_customer then raise exception 'You can order at most %', p.max_per_customer; end if;
  perform private.check_pool_distance(_pool, b);
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
end $$;

-- Skip ahead: the deadline is now for confirming
create or replace function public.admin_skip_ahead(_pool uuid) returns text
language plpgsql security definer set search_path = public as $$
declare p public.pools; res text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Pool not found'; end if;
  if not p.is_test then raise exception 'Skip ahead only works on test pools'; end if;
  if p.status = 'scheduled' then
    update public.pools set opens_at = now(), status = 'open' where id = _pool;
    res := 'opened';
  elsif p.status = 'awaiting_confirmation' then
    update public.pools set payment_deadline = now() where id = _pool;
    res := public.finalise_funding(_pool);
  else
    raise exception 'Only scheduled pools and pools waiting for shops to confirm can skip ahead';
  end if;
  perform public.audit('skip_ahead', 'pool', _pool, jsonb_build_object('from', p.status, 'result', res));
  return res;
end $$;

-- ===== Test data: the same stages under the pilot payment rules =====
drop function private.test_confirm(int, uuid);
create function private.test_confirm(_n int, _pool uuid, _method text default 'cash') returns void
language plpgsql set search_path = public as $$
begin
  perform private.test_act_as(private.test_shop(_n));
  perform public.confirm_order(private.test_order_of(_n, _pool), true, _method);
end $$;

-- Confirm with EFT, then the admin records the full EFT as verified (a shop that paid early)
create or replace function private.test_pay(_admin uuid, _n int, _pool uuid) returns void
language plpgsql set search_path = public as $$
declare o public.orders;
begin
  perform private.test_confirm(_n, _pool, 'eft');
  select * into o from public.orders where id = private.test_order_of(_n, _pool);
  perform private.test_act_as(_admin);
  perform public.admin_record_payment(o.id, o.total, 'TEST-EFT-' || o.ref, 'Test data', 'verified', 'eft');
end $$;

-- Every order in the pool confirmed (alternating cash and EFT, nobody paid yet), then funded
create or replace function private.test_fund(_admin uuid, _pool uuid) returns void
language plpgsql set search_path = public as $$
declare o record; i int := 0;
begin
  for o in select id, user_id from public.orders where pool_id = _pool and status = 'awaiting_confirmation'
      order by created_at loop
    perform private.test_act_as(o.user_id);
    perform public.confirm_order(o.id, true, case when i % 2 = 0 then 'cash' else 'eft' end);
    i := i + 1;
  end loop;
  perform private.test_act_as(_admin);
  perform public.admin_finalise_funding(_pool);
end $$;

-- Cash collected at the door
create or replace function private.test_cash(_admin uuid, _n int, _pool uuid) returns void
language plpgsql set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = private.test_order_of(_n, _pool);
  perform private.test_act_as(_admin);
  perform public.admin_record_payment(o.id, o.total, 'TEST-CASH-' || o.ref, 'Test data', 'verified', 'cash');
end $$;

-- Proofs go too. Uploaded files stay in the bucket (storage files can't be deleted from SQL).
create or replace function private.clear_test_data() returns text
language plpgsql set search_path = public as $$
declare uids uuid[]; pids uuid[]; oids uuid[]; touched uuid[]; pid uuid;
begin
  select coalesce(array_agg(id), '{}') into uids from auth.users
    where raw_app_meta_data ->> 'test_data' = 'true'
       or id in (select user_id from public.businesses where is_test);
  select coalesce(array_agg(id), '{}') into pids from public.pools
    where is_test or campaign_id = '7e57da7a-0000-4000-8000-000000000001' or proposed_by = any(uids);
  select coalesce(array_agg(id), '{}') into oids from public.orders
    where pool_id = any(pids) or user_id = any(uids);
  select coalesce(array_agg(distinct pool_id), '{}') into touched
    from (select pool_id from public.participations where user_id = any(uids)
          union all select pool_id from public.orders where user_id = any(uids)) t
    where not pool_id = any(pids);

  delete from public.payment_proofs where order_id = any(oids);
  delete from public.refunds where order_id = any(oids);
  delete from public.payments where order_id = any(oids);
  delete from public.orders where id = any(oids);
  delete from public.purchase_orders where pool_id = any(pids);
  delete from public.participations where pool_id = any(pids) or user_id = any(uids);
  delete from public.notifications n
    where exists (select 1 from unnest(pids || oids) x where n.link like '%' || x::text || '%');
  delete from public.pools where id = any(pids);
  delete from public.businesses where user_id = any(uids);
  delete from auth.users where id = any(uids);
  delete from public.campaigns where id = '7e57da7a-0000-4000-8000-000000000001';
  foreach pid in array touched loop
    perform public.recalc_pool(pid);
  end loop;
  return format('Removed %s test shops and %s test pools', cardinality(uids), cardinality(pids));
end $$;

create or replace function private.load_test_data(_admin uuid) returns text
language plpgsql set search_path = public as $$
declare pid uuid; claims text := current_setting('request.jwt.claims', true);
begin
  if not public.has_role(_admin, 'admin') then raise exception 'The test data must act as an admin'; end if;
  if exists (select 1 from auth.users where email like '2760000000_@phone.kasipool.co.za') then
    raise exception 'A real account uses one of the test numbers (060 000 0001 to 0009). Clear the test data first, or ask a developer.';
  end if;

  insert into public.campaigns (id, name, description)
  values ('7e57da7a-0000-4000-8000-000000000001', 'Test data',
    'Test pools for trying the app end to end. Reset or remove them in Admin, Settings.');

  perform private.test_make_shop(1, 'Thandeka''s Spaza (test)', 'Thandeka Mbeki', 'Spaza / general dealer',
    'Khayelitsha', '12 Ntlazane Road, Site C, Khayelitsha', -34.0310, 18.6620);
  perform private.test_make_shop(2, 'Lwazi Car Wash (test)', 'Lwazi Ndlovu', 'Car wash',
    'Khayelitsha', 'Corner of Govan Mbeki and Oscar Mpetha Road, Harare', -34.0560, 18.6680);
  perform private.test_make_shop(3, 'Nomsa''s Hair Salon (test)', 'Nomsa Dube', 'Hair & beauty salon',
    'Gugulethu', 'NY 1, next to the taxi rank, Gugulethu', -33.9800, 18.5700);
  perform private.test_make_shop(4, 'Langa Fresh Bakery (test)', 'Sipho Mahlangu', 'Bakery',
    'Langa', 'Washington Street, Langa', -33.9440, 18.5290);
  perform private.test_make_shop(5, 'Rocklands Mini Market (test)', 'Fatima Isaacs', 'Spaza / general dealer',
    'Mitchells Plain', 'AZ Berman Drive, Rocklands, Mitchells Plain', -34.0480, 18.6160);
  perform private.test_make_shop(6, 'Philippi Kota King (test)', 'Bongani Zulu', 'Takeaway / food vendor',
    'Philippi', 'Lansdowne Road, Philippi', -34.0100, 18.5900);
  perform private.test_make_shop(7, 'Mbekweni Corner Shop (test)', 'Ayanda Khumalo', 'Spaza / general dealer',
    'Mbekweni', 'Main Road, Mbekweni, Paarl', -33.6990, 18.9900);

  -- 1. Open, almost full: shop 1 joining with 4 or more fills it and it closes
  pid := private.test_make_pool(_admin, 'KP-MAI-10', 105, 90, 30, 20);
  perform private.test_join(2, pid, 8); perform private.test_join(3, pid, 8);
  perform private.test_join(4, pid, 6); perform private.test_join(5, pid, 4);

  -- 2. Open, just started: join, change the amount, leave
  pid := private.test_make_pool(_admin, 'KP-RIC-10', 189, 165, 60, 20);
  perform private.test_join(3, pid, 5); perform private.test_join(5, pid, 5);

  -- 3. Full, waiting for shops to confirm: shop 1 must confirm (and choose how to pay), shop 2
  --    chose cash, shop 3 chose EFT and can upload a proof, shop 4 already paid by EFT
  pid := private.test_make_pool(_admin, 'KP-SUG-10', 235, 205, 30, 15);
  perform private.test_join(1, pid, 10); perform private.test_join(2, pid, 8);
  perform private.test_join(3, pid, 7); perform private.test_join(4, pid, 5);
  perform private.test_confirm(2, pid, 'cash'); perform private.test_confirm(3, pid, 'eft');
  perform private.test_pay(_admin, 4, pid);

  -- 4. Confirmed: admin orders the stock from the supplier (nobody has paid yet)
  pid := private.test_make_pool(_admin, 'KP-OIL-2L6', 345, 300, 20, 10);
  perform private.test_join(1, pid, 5); perform private.test_join(2, pid, 5);
  perform private.test_join(3, pid, 5); perform private.test_join(5, pid, 5);
  perform private.test_fund(_admin, pid);

  -- 5. Ordered from the supplier: admin records what arrived (try fewer, to see totals drop)
  pid := private.test_make_pool(_admin, 'KP-FLR-10', 165, 145, 20, 10);
  perform private.test_join(1, pid, 6); perform private.test_join(4, pid, 8);
  perform private.test_join(6, pid, 6);
  perform private.test_fund(_admin, pid);
  perform private.test_act_as(_admin);
  perform public.admin_create_po(pid, 'TEST-PO-FLOUR', current_date, current_date + 3);

  -- 6. Stock received: admin sends it out for delivery
  pid := private.test_make_pool(_admin, 'KP-BEV-2L6', 150, 130, 30, 10);
  perform private.test_join(1, pid, 10); perform private.test_join(2, pid, 10);
  perform private.test_join(6, pid, 10);
  perform private.test_fund(_admin, pid);
  perform private.test_act_as(_admin);
  perform public.admin_create_po(pid, 'TEST-PO-COKE', current_date, current_date + 2);
  perform public.admin_receive_stock(pid, 30, null);

  -- 7. Out for delivery: shop 1 (cash) confirms or reports a problem; shop 2 (EFT) marked
  --    delivered by the courier and can upload a proof; shop 3 (cash) received and paid cash
  pid := private.test_make_pool(_admin, 'KP-DSH-750', 360, 315, 10, 5);
  perform private.test_join(1, pid, 3); perform private.test_join(2, pid, 3);
  perform private.test_join(3, pid, 4);
  perform private.test_fund(_admin, pid);
  perform private.test_act_as(_admin);
  perform public.admin_create_po(pid, 'TEST-PO-SUNLIGHT', current_date, current_date + 2);
  perform public.admin_receive_stock(pid, 10, null);
  perform public.admin_dispatch_pool(pid, 'TEST-COURIER-1');
  perform public.admin_mark_delivered(private.test_order_of(2, pid), 'Test data');
  perform private.test_act_as(private.test_shop(3));
  perform public.confirm_delivery_received(private.test_order_of(3, pid));
  perform private.test_cash(_admin, 3, pid);

  -- 8. Done: everyone got their stock. Shop 1 paid cash; shop 5 still owes (EFT, no proof yet)
  pid := private.test_make_pool(_admin, 'KP-SAL-1', 130, 110, 10, 10);
  perform private.test_join(1, pid, 4); perform private.test_join(5, pid, 6);
  perform private.test_fund(_admin, pid);
  perform private.test_act_as(_admin);
  perform public.admin_create_po(pid, 'TEST-PO-SALT', current_date, current_date + 2);
  perform public.admin_receive_stock(pid, 10, null);
  perform public.admin_dispatch_pool(pid, 'TEST-COURIER-2');
  perform private.test_act_as(private.test_shop(1));
  perform public.confirm_delivery_received(private.test_order_of(1, pid));
  perform private.test_act_as(private.test_shop(5));
  perform public.confirm_delivery_received(private.test_order_of(5, pid));
  perform private.test_cash(_admin, 1, pid);

  -- 9. Failed: shop 6 never confirmed and the closing time passed. Shop 1 paid early by EFT and
  --    is owed a refund; shop 4 chose cash and owes nothing
  pid := private.test_make_pool(_admin, 'KP-BRD-125', 190, 165, 20, 10);
  perform private.test_join(1, pid, 6); perform private.test_join(4, pid, 6);
  perform private.test_join(6, pid, 8);
  perform private.test_pay(_admin, 1, pid); perform private.test_confirm(4, pid, 'cash');
  update public.pools set closes_at = now() - interval '1 minute' where id = pid;
  perform private.test_act_as(_admin);
  perform public.admin_skip_ahead(pid);

  -- 10. Reopened: shop 5 never confirmed, so the deal is open again for 8 more
  pid := private.test_make_pool(_admin, 'KP-YST-500', 95, 80, 20, 10);
  perform private.test_join(1, pid, 6); perform private.test_join(3, pid, 6);
  perform private.test_join(5, pid, 8);
  perform private.test_confirm(1, pid, 'cash'); perform private.test_confirm(3, pid, 'eft');
  perform private.test_act_as(_admin);
  perform public.admin_skip_ahead(pid);

  -- 11. Private group asked for by shop 2: others join with code CARWASH1
  perform private.test_act_as(private.test_shop(2));
  pid := public.propose_pool((select id from public.products where sku = 'KP-CAR-5L4'), 'box', 6,
    null, 1, 3, now(), now() + interval '7 days', 'Car washes in Khayelitsha buying together', true);
  update public.pools set campaign_id = '7e57da7a-0000-4000-8000-000000000001',
      supplier_id = 'ca5e0000-0000-4000-8000-000000000001', reference_price = 520,
      reference_source = 'Estimated cash & carry price, October 2026', invite_code = 'CARWASH1'
    where id = pid;
  insert into public.pool_costs (pool_id, supplier_cost) values (pid, 440);
  perform private.test_act_as(_admin);
  perform public.admin_publish_pool(pid);
  perform private.test_join(2, pid, 2);

  -- 12. Asked for by shop 3, waiting for an admin to check prices and publish
  perform private.test_act_as(private.test_shop(3));
  perform public.propose_pool((select id from public.products where sku = 'KP-RLX-6'), 'box', 10,
    null, 1, 4, now(), now() + interval '10 days', 'Salons in Gugulethu and Nyanga', false);

  -- 13. Opens tomorrow: admin can open it now with "Testing: open now"
  perform private.test_make_pool(_admin, 'KP-BEV-2L6', 150, 130, 40, 10, interval '1 day');

  perform set_config('request.jwt.claims', coalesce(claims, ''), true);
  return 'Loaded 7 test shops and 13 test pools';
end $$;

-- The purchase terms changed (pay on delivery), so new confirmations record a new version
update public.app_settings set value = jsonb_set(value, '{version}', '"v0.2-draft"')
  where key = 'terms' and value ->> 'version' = 'v0.1-draft';

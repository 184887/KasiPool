create table public.yoco_checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  amount_cents integer not null check (amount_cents > 0),
  checkout_id text unique,
  payment_id text unique,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.yoco_checkout_attempts(order_id, status);

alter table public.yoco_checkout_attempts enable row level security;
grant select on public.yoco_checkout_attempts to authenticated, service_role;
create policy "admin read" on public.yoco_checkout_attempts
  for select to authenticated using (public.is_admin());

create table public.whatsapp_campaign_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, business_id)
);
create index on public.whatsapp_campaign_deliveries(campaign_id, status, created_at);

alter table public.whatsapp_campaign_deliveries enable row level security;
grant select on public.whatsapp_campaign_deliveries to authenticated, service_role;
create policy "admin read" on public.whatsapp_campaign_deliveries
  for select to authenticated using (public.is_admin());

create or replace function public.provider_prepare_yoco_checkout(_order uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  due numeric;
  attempt public.yoco_checkout_attempts;
begin
  select * into o from public.orders where id = _order and user_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'confirmed' then raise exception 'Only confirmed orders can be paid'; end if;
  if o.payment_status = 'paid' then raise exception 'This order is already paid'; end if;
  if not exists (
    select 1 from public.app_settings
    where key = 'payment' and value->>'online_enabled' = 'true'
  ) then raise exception 'Online payments are not enabled'; end if;

  due := o.total - o.amount_paid;
  if due <= 0 then raise exception 'There is no outstanding balance'; end if;

  insert into public.yoco_checkout_attempts(order_id, amount_cents)
  values (_order, round(due * 100)::integer)
  returning * into attempt;

  return jsonb_build_object(
    'attempt_id', attempt.id,
    'amount_cents', attempt.amount_cents,
    'order_ref', o.ref
  );
end $$;
revoke all on function public.provider_prepare_yoco_checkout(uuid) from public, anon;
grant execute on function public.provider_prepare_yoco_checkout(uuid) to authenticated;

create or replace function public.provider_attach_yoco_checkout(_attempt uuid, _checkout_id text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if _checkout_id is null or length(_checkout_id) = 0 then
    raise exception 'The payment provider returned an invalid checkout';
  end if;

  update public.yoco_checkout_attempts a
  set checkout_id = _checkout_id, updated_at = now()
  from public.orders o
  where a.id = _attempt
    and o.id = a.order_id
    and o.user_id = auth.uid()
    and a.status = 'pending'
    and a.checkout_id is null;

  if not found then raise exception 'Checkout attempt is no longer available'; end if;
end $$;
revoke all on function public.provider_attach_yoco_checkout(uuid, text) from public, anon;
grant execute on function public.provider_attach_yoco_checkout(uuid, text) to authenticated;

create or replace function public.provider_fail_yoco_checkout(_attempt uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.yoco_checkout_attempts a
  set status = 'failed', updated_at = now()
  from public.orders o
  where a.id = _attempt
    and o.id = a.order_id
    and o.user_id = auth.uid()
    and a.status = 'pending';
end $$;
revoke all on function public.provider_fail_yoco_checkout(uuid) from public, anon;
grant execute on function public.provider_fail_yoco_checkout(uuid) to authenticated;

create or replace function public.provider_complete_yoco_checkout(
  _attempt uuid,
  _payment_id text,
  _amount_cents integer,
  _currency text
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  a public.yoco_checkout_attempts;
  o public.orders;
  newpaid numeric;
  refund_due numeric;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Not authorised';
  end if;
  if _payment_id is null or _amount_cents is null or _amount_cents <= 0 or _currency <> 'ZAR' then
    return false;
  end if;

  select * into a from public.yoco_checkout_attempts where id = _attempt for update;
  if a.id is null then return false; end if;
  if a.status = 'succeeded' then return a.payment_id = _payment_id; end if;
  if a.status <> 'pending' then return false; end if;
  if exists (
    select 1 from public.yoco_checkout_attempts
    where payment_id = _payment_id and id <> _attempt
  ) then return false; end if;
  if a.amount_cents <> _amount_cents then
    update public.yoco_checkout_attempts set status = 'failed', updated_at = now() where id = _attempt;
    perform public.audit('yoco_payment_mismatch', 'order', a.order_id,
      jsonb_build_object('attempt_id', _attempt, 'expected_cents', a.amount_cents, 'received_cents', _amount_cents));
    return false;
  end if;

  select * into o from public.orders where id = a.order_id for update;
  if o.id is null or o.status <> 'confirmed' then
    update public.yoco_checkout_attempts set status = 'failed', updated_at = now() where id = _attempt;
    perform public.audit('yoco_payment_rejected', 'order', a.order_id,
      jsonb_build_object('attempt_id', _attempt, 'payment_id', _payment_id));
    return false;
  end if;

  newpaid := o.amount_paid + (_amount_cents::numeric / 100);
  refund_due := greatest(newpaid - o.total, 0) - greatest(o.amount_paid - o.total, 0);
  insert into public.payments(order_id, amount, kind, channel_reference, note)
  values (o.id, _amount_cents::numeric / 100, 'verified', 'Yoco:' || _payment_id, 'Online payment via Yoco');

  update public.orders
  set amount_paid = newpaid,
      payment_status = case when newpaid >= o.total then 'paid' else 'under_review' end,
      paid_at = case when newpaid >= o.total then now() else null end
  where id = o.id;

  update public.yoco_checkout_attempts
  set payment_id = _payment_id, status = 'succeeded', updated_at = now()
  where id = _attempt;
  perform public.recalc_pool(o.pool_id);

  if refund_due > 0 then
    insert into public.refunds(order_id, amount, reason)
    values (o.id, refund_due, 'Yoco payment overpayment');
  end if;
  if newpaid >= o.total then
    perform public.notify(
      o.user_id,
      case when refund_due > 0 then 'Payment received — refund due' else 'Payment confirmed' end,
      case when refund_due > 0
        then 'Your Yoco payment exceeded the amount due for order ' || o.ref ||
          '. KasiPool will refund the overpayment.'
        else 'We have verified your Yoco payment for order ' || o.ref || '.'
      end,
      '/orders/' || o.id
    );
  end if;
  perform public.audit('record_payment', 'order', o.id,
    jsonb_build_object(
      'amount', _amount_cents::numeric / 100,
      'provider', 'yoco',
      'payment_id', _payment_id,
      'refund_due', refund_due
    ));
  return true;
end $$;
revoke all on function public.provider_complete_yoco_checkout(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.provider_complete_yoco_checkout(uuid, text, integer, text) to service_role;

create or replace function public.provider_fail_yoco_webhook(_attempt uuid, _payment_id text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Not authorised';
  end if;
  update public.yoco_checkout_attempts
  set status = 'failed', payment_id = coalesce(_payment_id, payment_id), updated_at = now()
  where id = _attempt and status = 'pending';
end $$;
revoke all on function public.provider_fail_yoco_webhook(uuid, text) from public, anon, authenticated;
grant execute on function public.provider_fail_yoco_webhook(uuid, text) to service_role;

create or replace function public.provider_prepare_whatsapp_campaign(
  _campaign uuid,
  _retry_failed boolean default false
)
returns table (delivery_id uuid, business_id uuid, mobile text, trading_name text, campaign_name text, description text)
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Not authorised';
  end if;
  if not exists (select 1 from public.campaigns where id = _campaign) then
    raise exception 'Campaign not found';
  end if;

  insert into public.whatsapp_campaign_deliveries(campaign_id, business_id)
  select _campaign, b.id
  from public.businesses b
  where b.marketing_opt_in and b.mobile is not null
  on conflict (campaign_id, business_id) do nothing;

  if _retry_failed then
    update public.whatsapp_campaign_deliveries d
    set status = 'pending', error = null, updated_at = now()
    where d.campaign_id = _campaign
      and d.status = 'failed'
      and exists (
        select 1 from public.businesses b
        where b.id = d.business_id and b.marketing_opt_in
      );
  end if;

  update public.whatsapp_campaign_deliveries
  set status = 'pending', updated_at = now()
  where campaign_id = _campaign
    and status = 'sending'
    and updated_at < now() - interval '10 minutes';

  return query
  with ready as (
    select d.id
    from public.whatsapp_campaign_deliveries d
    where d.campaign_id = _campaign and d.status = 'pending'
      and exists (
        select 1 from public.businesses b
        where b.id = d.business_id and b.marketing_opt_in
      )
    order by d.created_at, d.id
    limit 40
    for update skip locked
  ), claimed as (
    update public.whatsapp_campaign_deliveries d
    set status = 'sending', updated_at = now()
    from ready
    where d.id = ready.id
    returning d.id, d.business_id
  )
  select claimed.id, b.id, b.mobile, b.trading_name, c.name, c.description
  from claimed
  join public.businesses b on b.id = claimed.business_id and b.marketing_opt_in
  join public.campaigns c on c.id = _campaign;
end $$;
revoke all on function public.provider_prepare_whatsapp_campaign(uuid, boolean) from public, anon, authenticated;
grant execute on function public.provider_prepare_whatsapp_campaign(uuid, boolean) to service_role;

create or replace function public.provider_finish_whatsapp_delivery(
  _delivery uuid,
  _status text,
  _provider_message_id text,
  _error text
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Not authorised';
  end if;
  if _status not in ('sent', 'failed') then raise exception 'Invalid delivery status'; end if;
  update public.whatsapp_campaign_deliveries
  set status = _status,
      provider_message_id = _provider_message_id,
      error = left(_error, 500),
      updated_at = now()
  where id = _delivery and status = 'sending';
  if not found then raise exception 'Delivery is not in progress'; end if;
end $$;
revoke all on function public.provider_finish_whatsapp_delivery(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.provider_finish_whatsapp_delivery(uuid, text, text, text) to service_role;

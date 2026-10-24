-- Same function as in 20261024100400_third_party_providers.sql; only the notification title
-- changes ("Payment received, refund due" instead of using an em dash).
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
      case when refund_due > 0 then 'Payment received, refund due' else 'Payment confirmed' end,
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

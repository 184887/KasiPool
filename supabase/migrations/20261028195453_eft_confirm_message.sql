-- Wording (2026-10-28): the message an EFT shop gets on confirming said "Pay by EFT ... then upload
-- your proof", which read as "pay now". Shops pay when their stock arrives (pilot), so say that.
-- Otherwise the same as confirm_order in 20261028174912_pay_on_delivery.sql.
create or replace function public.confirm_order(_order uuid, _accept boolean, _method text default null)
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
      else 'Order ' || reference || ' is confirmed. Pay when your stock arrives: by EFT with reference ' || reference
        || ', then send us your proof of payment in the app.'
    end, '/orders/' || _order);
  perform public.recalc_pool(o.pool_id);
  return reference;
end $function$;

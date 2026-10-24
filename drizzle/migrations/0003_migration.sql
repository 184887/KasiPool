create or replace function public.admin_finalise_funding(_pool uuid) returns text language plpgsql security definer set search_path = public as $$
declare res text; p public.pools;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool;
  if p.paid_qty < p.min_qty and p.payment_deadline > now() then
    raise exception 'Paid quantity is below the minimum. Wait for more payments or the deadline.';
  end if;
  res := public.finalise_funding(_pool);
  perform public.audit('finalise_funding','pool',_pool, jsonb_build_object('result',res));
  return res;
end $$;
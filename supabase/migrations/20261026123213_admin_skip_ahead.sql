-- Testing tool (2026-10-26): lets an admin move a pool to its next time-based step now instead of
-- waiting. A scheduled pool opens; a pool waiting for payment reaches its payment deadline, so
-- unpaid orders close and the pool is funded, reopens for the gap or fails (the same rules as
-- refresh_pool_states). Open pools already have admin_close_now.
create or replace function public.admin_skip_ahead(_pool uuid) returns text
language plpgsql security definer set search_path = public as $$
declare p public.pools; res text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Pool not found'; end if;
  if p.status = 'scheduled' then
    update public.pools set opens_at = now(), status = 'open' where id = _pool;
    res := 'opened';
  elsif p.status = 'awaiting_confirmation' then
    update public.pools set payment_deadline = now() where id = _pool;
    res := public.finalise_funding(_pool);
  else
    raise exception 'Only scheduled pools and pools waiting for payment can skip ahead';
  end if;
  perform public.audit('skip_ahead', 'pool', _pool, jsonb_build_object('from', p.status, 'result', res));
  return res;
end $$;
revoke execute on function public.admin_skip_ahead(uuid) from public, anon;
grant execute on function public.admin_skip_ahead(uuid) to authenticated;

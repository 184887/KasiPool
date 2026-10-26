-- Removes the test data made by load.sql: the test shop accounts (auth.users with
-- app_metadata.test_data = true), everything they did, and the pools in the "Test data" campaign.
-- Real deals that a test shop joined keep going: their counts are recalculated.
-- Run with: npm run test-data:clear (local stack). See docs/testing.md.
do $$
declare
  uids uuid[];
  pids uuid[];
  oids uuid[];
  touched uuid[];
  pid uuid;
begin
  select coalesce(array_agg(id), '{}') into uids
    from auth.users where raw_app_meta_data ->> 'test_data' = 'true';
  select coalesce(array_agg(id), '{}') into pids
    from public.pools
    where campaign_id = '7e57da7a-0000-4000-8000-000000000001' or proposed_by = any(uids);
  select coalesce(array_agg(id), '{}') into oids
    from public.orders where pool_id = any(pids) or user_id = any(uids);
  -- Real pools a test shop joined, to recount once the test shop is gone
  select coalesce(array_agg(distinct pool_id), '{}') into touched
    from (select pool_id from public.participations where user_id = any(uids)
          union all select pool_id from public.orders where user_id = any(uids)) t
    where not pool_id = any(pids);

  delete from public.refunds where order_id = any(oids);
  delete from public.payments where order_id = any(oids);
  delete from public.orders where id = any(oids);
  delete from public.purchase_orders where pool_id = any(pids);
  delete from public.participations where pool_id = any(pids) or user_id = any(uids);
  -- Admin notifications about test pools or orders
  delete from public.notifications n
    where exists (select 1 from unnest(pids || oids) x where n.link like '%' || x::text || '%');
  delete from public.pools where id = any(pids);
  delete from public.businesses where user_id = any(uids);
  delete from auth.users where id = any(uids); -- identities, sessions, roles cascade
  delete from public.campaigns where id = '7e57da7a-0000-4000-8000-000000000001';

  foreach pid in array touched loop
    perform public.recalc_pool(pid);
  end loop;
  raise notice 'Removed % test shops and % test pools', cardinality(uids), cardinality(pids);
end $$;

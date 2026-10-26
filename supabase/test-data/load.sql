-- Loads fresh test data (run clear.sql first; npm run test-data does both), acting as the first
-- admin for the admin steps. Same as "Reset test data" in Admin -> Settings. The loader is
-- private.load_test_data in migration 20261026130322_test_data_on_production.sql.
select private.load_test_data((select user_id from public.user_roles where role = 'admin' limit 1));

select pr.name as product, p.status, p.pledged_qty || '/' || p.min_qty as joined,
  p.paid_qty as paid, coalesce(p.invite_code, '') as code
from public.pools p join public.products pr on pr.id = p.product_id
where p.is_test
order by array_position(array['draft', 'scheduled', 'open', 'awaiting_confirmation', 'funded',
  'procurement', 'stock_received', 'out_for_delivery', 'completed', 'refund_resolution'], p.status),
  pr.name;

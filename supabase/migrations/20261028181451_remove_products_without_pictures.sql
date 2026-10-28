-- Demo clean-up (2026-10-28): remove the four products that have no picture (bread flour, yeast,
-- relaxer, car wash shampoo) and their deals. None of their deals had shops or orders. The test
-- pools move to the eight pictured products, and the test data is reloaded.

-- ===== Test data: the same 13 stages, only pictured products =====
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
  pid := private.test_make_pool(_admin, 'KP-RIC-10', 189, 165, 20, 10);
  perform private.test_join(1, pid, 6); perform private.test_join(4, pid, 6);
  perform private.test_join(6, pid, 8);
  perform private.test_pay(_admin, 1, pid); perform private.test_confirm(4, pid, 'cash');
  update public.pools set closes_at = now() - interval '1 minute' where id = pid;
  perform private.test_act_as(_admin);
  perform public.admin_skip_ahead(pid);

  -- 10. Reopened: shop 5 never confirmed, so the deal is open again for 8 more
  pid := private.test_make_pool(_admin, 'KP-OIL-2L6', 345, 300, 20, 10);
  perform private.test_join(1, pid, 6); perform private.test_join(3, pid, 6);
  perform private.test_join(5, pid, 8);
  perform private.test_confirm(1, pid, 'cash'); perform private.test_confirm(3, pid, 'eft');
  perform private.test_act_as(_admin);
  perform public.admin_skip_ahead(pid);

  -- 11. Private group asked for by shop 2: others join with code CARWASH1
  perform private.test_act_as(private.test_shop(2));
  pid := public.propose_pool((select id from public.products where sku = 'KP-DSH-750'), 'box', 6,
    null, 1, 3, now(), now() + interval '7 days', 'Car washes in Khayelitsha buying together', true);
  update public.pools set campaign_id = '7e57da7a-0000-4000-8000-000000000001',
      supplier_id = 'ca5e0000-0000-4000-8000-000000000001', reference_price = 360,
      reference_source = 'Estimated cash & carry price, October 2026', invite_code = 'CARWASH1'
    where id = pid;
  insert into public.pool_costs (pool_id, supplier_cost) values (pid, 315);
  perform private.test_act_as(_admin);
  perform public.admin_publish_pool(pid);
  perform private.test_join(2, pid, 2);

  -- 12. Asked for by shop 3, waiting for an admin to check prices and publish
  perform private.test_act_as(private.test_shop(3));
  perform public.propose_pool((select id from public.products where sku = 'KP-SAL-1'), 'bale', 10,
    null, 1, 4, now(), now() + interval '10 days', 'Shops in Gugulethu and Nyanga', false);

  -- 13. Opens tomorrow: admin can open it now with "Testing: open now"
  perform private.test_make_pool(_admin, 'KP-BEV-2L6', 150, 130, 40, 10, interval '1 day');

  perform set_config('request.jwt.claims', coalesce(claims, ''), true);
  return 'Loaded 7 test shops and 13 test pools';
end $$;

-- ===== Remove the products without pictures and their deals =====
select private.clear_test_data();

delete from public.notifications n
  using public.pools p join public.products pr on pr.id = p.product_id
  where pr.sku in ('KP-BRD-125', 'KP-YST-500', 'KP-RLX-6', 'KP-CAR-5L4')
    and n.link like '%' || p.id::text || '%';
-- Pool costs, locations, members and interest go with the pool (on delete cascade)
delete from public.pools p using public.products pr
  where pr.id = p.product_id and pr.sku in ('KP-BRD-125', 'KP-YST-500', 'KP-RLX-6', 'KP-CAR-5L4');
delete from public.products where sku in ('KP-BRD-125', 'KP-YST-500', 'KP-RLX-6', 'KP-CAR-5L4');
-- Their categories are empty now
delete from public.categories c
  where c.slug in ('hair-beauty', 'car-care', 'baking')
    and not exists (select 1 from public.products p where p.category_id = c.id);

-- ===== Reload the test data, acting as the first admin =====
select private.load_test_data(user_id)
from (select user_id from public.user_roles where role = 'admin' order by user_id limit 1) a;

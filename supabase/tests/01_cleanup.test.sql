-- Run with `npx supabase test db` against the local stack (`npx supabase start`).
begin;
select plan(8);

-- Providers removed
select hasnt_table('public', 'yoco_checkout_attempts', 'Yoco table is gone');
select hasnt_table('public', 'whatsapp_campaign_deliveries', 'WhatsApp deliveries table is gone');
select hasnt_function('public', 'provider_prepare_yoco_checkout', 'Yoco functions are gone');

-- Lifecycle timer
select is(
  (select schedule from cron.job where jobname = 'refresh-pool-states'),
  '* * * * *',
  'refresh_pool_states runs every minute'
);

-- User links: an account with a business can't be deleted, notifications go with the account
insert into auth.users (id, email, aud, role)
values ('00000000-0000-0000-0000-0000000000a1', 'a1@test.local', 'authenticated', 'authenticated');
insert into public.delivery_zones (id, name) values ('00000000-0000-0000-0000-0000000000e1', 'Test zone');
insert into public.businesses (user_id, trading_name, rep_name, mobile, township, city, province, address, zone_id, latitude, longitude)
values ('00000000-0000-0000-0000-0000000000a1', 'Test Spaza', 'Thandi', '+27600000001', 'Khayelitsha', 'Cape Town', 'Western Cape',
  '1 Main Rd', '00000000-0000-0000-0000-0000000000e1', -34.0116, 18.6458);
select throws_ok(
  $$delete from auth.users where id = '00000000-0000-0000-0000-0000000000a1'$$,
  '23503',
  null,
  'deleting an account that owns a business is blocked'
);

insert into auth.users (id, email, aud, role)
values ('00000000-0000-0000-0000-0000000000a2', 'a2@test.local', 'authenticated', 'authenticated');
insert into public.notifications (user_id, title) values ('00000000-0000-0000-0000-0000000000a2', 'Hi');
delete from auth.users where id = '00000000-0000-0000-0000-0000000000a2';
select is(
  (select count(*)::int from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a2'),
  0,
  'notifications are deleted with the account'
);

select fk_ok('public', 'orders', 'user_id', 'auth', 'users', 'id', 'orders link to accounts');
select fk_ok('public', 'participations', 'user_id', 'auth', 'users', 'id', 'participations link to accounts');

select * from finish();
rollback;

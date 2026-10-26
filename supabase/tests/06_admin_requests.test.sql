begin;
select plan(12);

-- Start from no requests, whatever the local database holds (rolled back at the end)
delete from public.admin_requests;

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000ad01', 'boss@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000ad02', 'New.Person@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000ad03', 'other@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000c001', '27600000011@phone.kasipool.co.za', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000ad01', 'admin');

-- Asking
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select throws_ok($$select public.request_admin_access('Shop Owner')$$,
  'P0001', 'Use your email address to ask for admin access', 'business (phone) logins cannot ask');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select throws_ok($$select public.request_admin_access('Boss')$$,
  'P0001', 'You already have admin access', 'admins do not need to ask');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad02');
select throws_ok($$select public.request_admin_access(' ')$$,
  'P0001', 'Enter your name', 'a name is needed');
select lives_ok($$select public.request_admin_access('Naledi Dlamini')$$, 'a team member can ask');
select results_eq(
  $$select status, email from public.admin_requests where user_id = '00000000-0000-0000-0000-00000000ad02'$$,
  $$values ('pending'::text, 'new.person@test.local'::text)$$,
  'the request waits, with the email from the account');

-- Who can see requests
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad03');
select public.request_admin_access('Other Person');
set local role authenticated;
select is((select count(*)::int from public.admin_requests), 1, 'non-admins only see their own request');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select is((select count(*)::int from public.admin_requests), 2, 'admins see every request');
reset role;

-- Reviewing
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad03');
select throws_ok($$select public.admin_review_access('00000000-0000-0000-0000-00000000ad02', true)$$,
  'P0001', 'Not authorised', 'only admins can approve');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select lives_ok($$select public.admin_review_access('00000000-0000-0000-0000-00000000ad02', true)$$, 'an admin approves');
select ok(public.has_role('00000000-0000-0000-0000-00000000ad02', 'admin'), 'approving grants admin access');
select throws_ok($$select public.admin_review_access('00000000-0000-0000-0000-00000000ad02', false)$$,
  'P0001', 'This request has already been handled', 'a request is handled once');
select public.admin_review_access('00000000-0000-0000-0000-00000000ad03', false);
select ok(not public.has_role('00000000-0000-0000-0000-00000000ad03', 'admin'), 'declining does not grant access');

select * from finish();
rollback;

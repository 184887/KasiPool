-- Cleanup after the business review (2026-10-25):
-- 1. Remove Yoco card payments and WhatsApp campaign sending (EFT only for now).
-- 2. Link user columns to auth.users so deleting an account can't leave orphaned records.
-- 3. Add missing indexes.
-- 4. Run refresh_pool_states() every minute with pg_cron, so pools close and deadlines expire
--    on time instead of only when someone opens a page.

-- 1. Providers
drop function if exists public.provider_prepare_yoco_checkout(uuid);
drop function if exists public.provider_attach_yoco_checkout(uuid, text);
drop function if exists public.provider_fail_yoco_checkout(uuid);
drop function if exists public.provider_complete_yoco_checkout(uuid, text, integer, text);
drop function if exists public.provider_fail_yoco_webhook(uuid, text);
drop function if exists public.provider_prepare_whatsapp_campaign(uuid, boolean);
drop function if exists public.provider_finish_whatsapp_delivery(uuid, text, text, text);
drop table if exists public.yoco_checkout_attempts;
drop table if exists public.whatsapp_campaign_deliveries;

-- 2. User links. Money records (businesses, participations, orders) block deleting the account;
-- personal leftovers (notifications, private group memberships) go with it.
alter table public.businesses
  add constraint businesses_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table public.participations
  add constraint participations_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict;
alter table public.orders
  add constraint orders_user_id_fkey foreign key (user_id) references auth.users(id) on delete restrict,
  add constraint orders_collected_by_fkey foreign key (collected_by) references auth.users(id) on delete set null;
alter table public.notifications
  add constraint notifications_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.pool_members
  add constraint pool_members_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.pools
  add constraint pools_proposed_by_fkey foreign key (proposed_by) references auth.users(id) on delete set null;
alter table public.payments
  add constraint payments_recorded_by_fkey foreign key (recorded_by) references auth.users(id) on delete set null;
alter table public.refunds
  add constraint refunds_recorded_by_fkey foreign key (recorded_by) references auth.users(id) on delete set null;
alter table public.purchase_orders
  add constraint purchase_orders_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
-- audit_events.actor stays unlinked on purpose: the audit trail outlives accounts.

-- 3. Indexes for lookups by order and business
create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists refunds_order_id_idx on public.refunds(order_id);
create index if not exists participations_business_id_idx on public.participations(business_id);
create index if not exists orders_business_id_idx on public.orders(business_id);

-- 4. Pool lifecycle timer
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
do $$
begin
  if exists (select 1 from cron.job where jobname = 'refresh-pool-states') then
    perform cron.unschedule('refresh-pool-states');
  end if;
  perform cron.schedule('refresh-pool-states', '* * * * *', 'select public.refresh_pool_states()');
end $$;

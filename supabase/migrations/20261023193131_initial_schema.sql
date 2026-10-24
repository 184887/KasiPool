
-- ===== Roles =====
create type public.app_role as enum ('admin','customer');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ===== Reference data =====
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, sort int not null default 0);
create table public.collection_points (
  id uuid primary key default gen_random_uuid(), name text not null, area text not null, address text,
  instructions text, fee_note text default 'No collection fee', active boolean not null default true, created_at timestamptz not null default now());
create table public.suppliers (
  id uuid primary key default gen_random_uuid(), name text not null, contact_person text, mobile text, email text,
  location text, categories text[] default '{}', notes text, active boolean not null default true, is_demo boolean not null default false, created_at timestamptz not null default now());
create table public.products (
  id uuid primary key default gen_random_uuid(), sku text not null unique, name text not null,
  category_id uuid references public.categories(id), brand text, description text,
  unit text not null default 'carton', pack_size text, image_url text, active boolean not null default true,
  is_demo boolean not null default false, created_at timestamptz not null default now());
create table public.campaigns (
  id uuid primary key default gen_random_uuid(), name text not null, description text,
  is_demo boolean not null default false, created_at timestamptz not null default now());

create table public.pools (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  product_id uuid not null references public.products(id),
  supplier_id uuid references public.suppliers(id),
  unit text not null,
  price numeric(12,2) not null check (price > 0),
  reference_price numeric(12,2), reference_source text, reference_date date,
  fee_note text default 'No additional fees',
  min_qty int not null check (min_qty > 0),
  max_qty int check (max_qty is null or max_qty >= min_qty),
  min_per_customer int not null default 1 check (min_per_customer >= 1),
  max_per_customer int,
  opens_at timestamptz not null default now(),
  closes_at timestamptz not null,
  collection_point_id uuid references public.collection_points(id),
  fulfilment_note text,
  confirm_window_hours int not null default 24 check (confirm_window_hours between 1 and 336),
  status text not null default 'draft' check (status in ('draft','scheduled','open','awaiting_confirmation','funded','procurement','stock_received','ready_for_collection','completed','unsuccessful','cancelled','refund_resolution')),
  pledged_qty int not null default 0, participant_count int not null default 0,
  confirmed_qty int not null default 0, paid_qty int not null default 0,
  payment_deadline timestamptz, qualified_at timestamptz, closed_at timestamptz,
  outcome_note text, is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index on public.pools(status); create index on public.pools(closes_at);

create table public.pool_costs (pool_id uuid primary key references public.pools(id) on delete cascade, supplier_cost numeric(12,2) not null check (supplier_cost >= 0));

create table public.businesses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique,
  trading_name text not null, rep_name text not null, mobile text not null, email text,
  category text, township text not null, city text not null, province text not null, address text,
  terms_accepted_at timestamptz not null default now(), terms_version text not null default 'v0.1-draft',
  notify_in_app boolean not null default true, marketing_opt_in boolean not null default false,
  is_demo boolean not null default false, created_at timestamptz not null default now());

create table public.participations (
  id uuid primary key default gen_random_uuid(), pool_id uuid not null references public.pools(id) on delete cascade,
  user_id uuid not null, business_id uuid not null references public.businesses(id),
  quantity int not null check (quantity > 0), status text not null default 'active' check (status in ('active','withdrawn','converted')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (pool_id, user_id));
create index on public.participations(user_id);

create sequence public.order_ref_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(), ref text unique,
  pool_id uuid not null references public.pools(id), participation_id uuid unique references public.participations(id),
  user_id uuid not null, business_id uuid not null references public.businesses(id),
  quantity int not null check (quantity > 0), unit_price numeric(12,2) not null, total numeric(12,2) not null,
  status text not null default 'awaiting_confirmation' check (status in ('awaiting_confirmation','confirmed','declined','expired','cancelled','failed')),
  terms_version text, confirmed_at timestamptz, declined_at timestamptz,
  payment_status text not null default 'not_due' check (payment_status in ('not_due','awaiting_payment','under_review','paid','issue','expired','refunded')),
  payment_reference text, amount_paid numeric(12,2) not null default 0, paid_at timestamptz,
  fulfilment_status text not null default 'none' check (fulfilment_status in ('none','ordered','allocated','short','ready','collected')),
  allocated_qty int not null default 0, collection_code text, ready_at timestamptz,
  collected_at timestamptz, collected_by uuid, failure_reason text,
  is_demo boolean not null default false, created_at timestamptz not null default now());
create index on public.orders(user_id); create index on public.orders(pool_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
  amount numeric(12,2) not null check (amount > 0), kind text not null default 'verified' check (kind in ('verified','review')),
  channel_reference text, note text, recorded_by uuid, created_at timestamptz not null default now());
create table public.refunds (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
  amount numeric(12,2) not null check (amount > 0), reason text not null, status text not null default 'owed' check (status in ('owed','completed')),
  completed_reference text, recorded_by uuid, completed_at timestamptz, created_at timestamptz not null default now());
create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(), pool_id uuid not null unique references public.pools(id),
  supplier_id uuid references public.suppliers(id), quantity int not null, unit_cost numeric(12,2) not null, total numeric(12,2) not null,
  supplier_ref text, order_date date, expected_date date,
  status text not null default 'ordered' check (status in ('ordered','received','partially_received')),
  received_qty int, discrepancy_note text, received_at timestamptz, created_by uuid, created_at timestamptz not null default now());
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null, title text not null, body text, link text,
  read_at timestamptz, created_at timestamptz not null default now());
create index on public.notifications(user_id, created_at desc);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), actor uuid, action text not null, entity text not null, entity_id uuid,
  details jsonb default '{}', created_at timestamptz not null default now());
create table public.app_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());

-- ===== Grants =====
grant select on public.categories, public.collection_points, public.products, public.campaigns, public.pools, public.app_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.collection_points, public.products, public.campaigns, public.pools, public.app_settings to authenticated;
grant select, insert, update, delete on public.suppliers, public.pool_costs to authenticated;
grant select, insert, update on public.businesses to authenticated;
grant select on public.participations, public.orders, public.payments, public.refunds, public.purchase_orders, public.audit_events to authenticated;
grant select, update on public.notifications to authenticated;
grant all on all tables in schema public to service_role;
grant usage on sequence public.order_ref_seq to service_role;

-- ===== RLS =====
alter table public.categories enable row level security;
alter table public.collection_points enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.campaigns enable row level security;
alter table public.pools enable row level security;
alter table public.pool_costs enable row level security;
alter table public.businesses enable row level security;
alter table public.participations enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_events enable row level security;
alter table public.app_settings enable row level security;

create policy "public read" on public.categories for select using (true);
create policy "admin write" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read" on public.collection_points for select using (true);
create policy "admin write" on public.collection_points for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read" on public.products for select using (active or public.is_admin());
create policy "admin write" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read" on public.campaigns for select using (true);
create policy "admin write" on public.campaigns for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read published" on public.pools for select using (status <> 'draft' or public.is_admin());
create policy "admin write" on public.pools for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin only" on public.suppliers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin only" on public.pool_costs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "own or admin read" on public.businesses for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "own insert" on public.businesses for insert to authenticated with check (user_id = auth.uid());
create policy "own update" on public.businesses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own or admin" on public.participations for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "own or admin" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "own or admin" on public.payments for select to authenticated using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own or admin" on public.refunds for select to authenticated using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "admin" on public.purchase_orders for select to authenticated using (public.is_admin());
create policy "own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own mark read" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin" on public.audit_events for select to authenticated using (public.is_admin());
create policy "public read" on public.app_settings for select using (true);
create policy "admin write" on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ===== Helpers =====
create or replace function public.notify(_user uuid, _title text, _body text, _link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(user_id, title, body, link) values (_user, _title, _body, _link);
$$;
create or replace function public.audit(_action text, _entity text, _id uuid, _details jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into public.audit_events(actor, action, entity, entity_id, details) values (auth.uid(), _action, _entity, _id, _details);
$$;
revoke execute on function public.notify(uuid,text,text,text) from public, anon, authenticated;
revoke execute on function public.audit(text,text,uuid,jsonb) from public, anon, authenticated;

create or replace function public.recalc_pool(_pool uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.pools p set
    pledged_qty = coalesce((select sum(quantity) from public.participations where pool_id = _pool and status in ('active','converted')),0),
    participant_count = (select count(*) from public.participations where pool_id = _pool and status in ('active','converted')),
    confirmed_qty = coalesce((select sum(quantity) from public.orders where pool_id = _pool and status = 'confirmed'),0),
    paid_qty = coalesce((select sum(quantity) from public.orders where pool_id = _pool and status = 'confirmed' and payment_status = 'paid'),0),
    updated_at = now()
  where p.id = _pool;
end $$;
revoke execute on function public.recalc_pool(uuid) from public, anon, authenticated;

create or replace function public.trg_recalc() returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.recalc_pool(coalesce(new.pool_id, old.pool_id)); return null; end $$;
create trigger participations_recalc after insert or update or delete on public.participations for each row execute function public.trg_recalc();
create trigger orders_recalc after insert or update or delete on public.orders for each row execute function public.trg_recalc();

-- Lock commercial terms once published
create or replace function public.trg_lock_pool() returns trigger language plpgsql set search_path = public as $$
begin
  if old.status <> 'draft' and (new.price is distinct from old.price or new.unit is distinct from old.unit
     or new.product_id is distinct from old.product_id or new.min_qty is distinct from old.min_qty
     or new.reference_price is distinct from old.reference_price or new.max_per_customer is distinct from old.max_per_customer) then
    raise exception 'Commercial terms are locked after publication. Cancel and create a revised offer.';
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger pools_lock before update on public.pools for each row execute function public.trg_lock_pool();

-- ===== Lifecycle engine =====
create or replace function public.close_pool(_pool uuid) returns void language plpgsql security definer set search_path = public as $$
declare p public.pools; part record; pname text;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'open' then return; end if;
  select name into pname from public.products where id = p.product_id;
  if p.pledged_qty >= p.min_qty then
    update public.pools set status = 'awaiting_confirmation', qualified_at = now(), closed_at = now(),
      payment_deadline = now() + make_interval(hours => p.confirm_window_hours) where id = _pool;
    for part in select * from public.participations where pool_id = _pool and status = 'active' loop
      insert into public.orders(pool_id, participation_id, user_id, business_id, quantity, unit_price, total, is_demo)
      values (_pool, part.id, part.user_id, part.business_id, part.quantity, p.price, p.price * part.quantity, p.is_demo);
      update public.participations set status = 'converted' where id = part.id;
      perform public.notify(part.user_id, 'Target reached: confirm your order',
        'The ' || pname || ' pool reached its target. Please confirm your order before the deadline.', '/my-pools');
    end loop;
  else
    update public.pools set status = 'unsuccessful', closed_at = now(), outcome_note = 'Minimum target not reached by the closing time.' where id = _pool;
    for part in select * from public.participations where pool_id = _pool and status = 'active' loop
      perform public.notify(part.user_id, 'Offer unsuccessful',
        'The ' || pname || ' pool did not reach its target. No payment is required.', '/my-pools');
    end loop;
  end if;
end $$;
revoke execute on function public.close_pool(uuid) from public, anon, authenticated;

create or replace function public.finalise_funding(_pool uuid) returns text language plpgsql security definer set search_path = public as $$
declare p public.pools; o record; pname text;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'awaiting_confirmation' then return p.status; end if;
  select name into pname from public.products where id = p.product_id;
  -- expire anything not fully paid
  for o in select * from public.orders where pool_id = _pool and (status = 'awaiting_confirmation' or (status = 'confirmed' and payment_status <> 'paid')) loop
    update public.orders set status = 'expired', payment_status = case when payment_status in ('awaiting_payment','under_review','issue','not_due') then 'expired' else payment_status end,
      failure_reason = 'Not confirmed and fully paid before the deadline' where id = o.id;
    if o.amount_paid > 0 then
      insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Partial payment received but order expired');
    end if;
    perform public.notify(o.user_id, 'Order expired', 'Your ' || pname || ' order was not completed before the deadline.', '/orders/' || o.id);
  end loop;
  perform public.recalc_pool(_pool);
  select * into p from public.pools where id = _pool;
  if p.paid_qty >= p.min_qty then
    update public.pools set status = 'funded', outcome_note = null where id = _pool;
    for o in select * from public.orders where pool_id = _pool and payment_status = 'paid' loop
      perform public.notify(o.user_id, 'Your order is being processed', 'The ' || pname || ' pool is fully funded. We are ordering stock.', '/orders/' || o.id);
    end loop;
    return 'funded';
  else
    update public.pools set status = case when p.paid_qty > 0 then 'refund_resolution' else 'unsuccessful' end,
      outcome_note = 'Paid quantity (' || p.paid_qty || ') below minimum (' || p.min_qty || ') at payment deadline.' where id = _pool;
    for o in select * from public.orders where pool_id = _pool and payment_status = 'paid' loop
      update public.orders set status = 'failed', failure_reason = 'Pool was not fully funded' where id = o.id;
      insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Pool not funded: full refund due');
      perform public.notify(o.user_id, 'Offer unsuccessful: refund due', 'The ' || pname || ' pool was not fully funded. Your payment will be refunded.', '/orders/' || o.id);
    end loop;
    return 'failed';
  end if;
end $$;
revoke execute on function public.finalise_funding(uuid) from public, anon, authenticated;

create or replace function public.refresh_pool_states() returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  update public.pools set status = 'open' where status = 'scheduled' and opens_at <= now();
  for r in select id from public.pools where status = 'open' and (closes_at <= now() or pledged_qty >= min_qty) loop
    perform public.close_pool(r.id);
  end loop;
  for r in select id from public.pools where status = 'awaiting_confirmation' and payment_deadline <= now() loop
    perform public.finalise_funding(r.id);
  end loop;
end $$;
grant execute on function public.refresh_pool_states() to anon, authenticated;

-- ===== Customer actions =====
create or replace function public.join_pool(_pool uuid, _qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.pools; b public.businesses; existing public.participations; others int;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  select * into b from public.businesses where user_id = auth.uid();
  if b.id is null then raise exception 'Please complete your business profile first'; end if;
  perform public.refresh_pool_states();
  select * into p from public.pools where id = _pool for update;
  if p.id is null then raise exception 'Offer not found'; end if;
  if p.status <> 'open' or p.closes_at <= now() then raise exception 'This pool is no longer open'; end if;
  if _qty is null or _qty < p.min_per_customer then raise exception 'Minimum quantity is %', p.min_per_customer; end if;
  if p.max_per_customer is not null and _qty > p.max_per_customer then raise exception 'Maximum per business is %', p.max_per_customer; end if;
  select * into existing from public.participations where pool_id = _pool and user_id = auth.uid();
  select coalesce(sum(quantity),0) into others from public.participations where pool_id = _pool and status = 'active' and user_id <> auth.uid();
  if p.max_qty is not null and others + _qty > p.max_qty then raise exception 'Only % more can be added to this pool', greatest(p.max_qty - others,0); end if;
  if existing.id is null then
    insert into public.participations(pool_id, user_id, business_id, quantity) values (_pool, auth.uid(), b.id, _qty);
    perform public.notify(auth.uid(), 'You joined a pool', 'You registered interest in ' || _qty || ' ' || p.unit || '(s). No payment needed yet.', '/offers/' || _pool);
  else
    update public.participations set quantity = _qty, status = 'active', updated_at = now() where id = existing.id;
  end if;
  perform public.recalc_pool(_pool);
  perform public.refresh_pool_states();
  return jsonb_build_object('updated', existing.id is not null);
end $$;
grant execute on function public.join_pool(uuid,int) to authenticated;

create or replace function public.withdraw_from_pool(_pool uuid) returns void language plpgsql security definer set search_path = public as $$
declare p public.pools;
begin
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'open' then raise exception 'You can only withdraw while the pool is open'; end if;
  update public.participations set status = 'withdrawn', updated_at = now() where pool_id = _pool and user_id = auth.uid() and status = 'active';
  perform public.recalc_pool(_pool);
end $$;
grant execute on function public.withdraw_from_pool(uuid) to authenticated;

create or replace function public.confirm_order(_order uuid, _accept boolean) returns text language plpgsql security definer set search_path = public as $$
declare o public.orders; p public.pools; tv text; reference text;
begin
  select * into o from public.orders where id = _order and user_id = auth.uid() for update;
  if o.id is null then raise exception 'Order not found'; end if;
  if o.status <> 'awaiting_confirmation' then raise exception 'This order can no longer be confirmed'; end if;
  select * into p from public.pools where id = o.pool_id;
  if p.status <> 'awaiting_confirmation' or p.payment_deadline <= now() then raise exception 'The confirmation window has closed'; end if;
  if not _accept then raise exception 'You must accept the terms to confirm'; end if;
  select value->>'version' into tv from public.app_settings where key = 'terms';
  reference := 'KP-' || to_char(now() at time zone 'Africa/Johannesburg','YYMM') || '-' || nextval('public.order_ref_seq');
  update public.orders set status = 'confirmed', confirmed_at = now(), terms_version = coalesce(tv,'v0.1-draft'),
    ref = reference, payment_reference = reference, payment_status = 'awaiting_payment' where id = _order;
  perform public.notify(auth.uid(), 'Payment required', 'Order ' || reference || ' confirmed. Please pay before the deadline.', '/orders/' || _order);
  return reference;
end $$;
grant execute on function public.confirm_order(uuid, boolean) to authenticated;

create or replace function public.decline_order(_order uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.orders set status = 'declined', declined_at = now() where id = _order and user_id = auth.uid() and status = 'awaiting_confirmation';
  if not found then raise exception 'This order cannot be declined'; end if;
end $$;
grant execute on function public.decline_order(uuid) to authenticated;

-- ===== Admin bootstrap =====
create or replace function public.admin_exists() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where role = 'admin') $$;
grant execute on function public.admin_exists() to anon, authenticated;
create or replace function public.claim_first_admin() returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(4242);
  if exists(select 1 from public.user_roles where role = 'admin') then raise exception 'An administrator already exists'; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(), 'admin');
  perform public.audit('claim_first_admin','user', auth.uid());
end $$;
grant execute on function public.claim_first_admin() to authenticated;
create or replace function public.admin_set_role(_email text, _make_admin boolean) returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select id into uid from auth.users where lower(email) = lower(_email);
  if uid is null then raise exception 'No account with that email'; end if;
  if _make_admin then insert into public.user_roles(user_id, role) values (uid,'admin') on conflict do nothing;
  else
    if uid = auth.uid() then raise exception 'You cannot remove your own admin role'; end if;
    delete from public.user_roles where user_id = uid and role = 'admin';
  end if;
  perform public.audit(case when _make_admin then 'grant_admin' else 'revoke_admin' end, 'user', uid, jsonb_build_object('email',_email));
end $$;
grant execute on function public.admin_set_role(text,boolean) to authenticated;

-- ===== Admin actions =====
create or replace function public.admin_publish_pool(_pool uuid) returns void language plpgsql security definer set search_path = public as $$
declare p public.pools;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'draft' then raise exception 'Only drafts can be published'; end if;
  if p.closes_at <= now() then raise exception 'Closing time must be in the future'; end if;
  if not exists(select 1 from public.pool_costs where pool_id = _pool) then raise exception 'Enter the supplier cost before publishing'; end if;
  update public.pools set status = case when opens_at > now() then 'scheduled' else 'open' end where id = _pool;
  perform public.audit('publish_pool','pool',_pool);
end $$;
grant execute on function public.admin_publish_pool(uuid) to authenticated;

create or replace function public.admin_cancel_pool(_pool uuid, _reason text) returns void language plpgsql security definer set search_path = public as $$
declare o record; pt record;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.pools set status = 'cancelled', outcome_note = _reason, closed_at = now() where id = _pool and status in ('draft','scheduled','open','awaiting_confirmation');
  if not found then raise exception 'This pool cannot be cancelled at its current stage'; end if;
  for pt in select * from public.participations where pool_id = _pool and status = 'active' loop
    perform public.notify(pt.user_id, 'Offer cancelled', coalesce(_reason,'This offer was cancelled.') || ' No payment is required.', '/my-pools');
  end loop;
  for o in select * from public.orders where pool_id = _pool and status in ('awaiting_confirmation','confirmed') loop
    update public.orders set status = 'cancelled', failure_reason = _reason, payment_status = case when amount_paid > 0 then payment_status else 'not_due' end where id = o.id;
    if o.amount_paid > 0 then insert into public.refunds(order_id, amount, reason) values (o.id, o.amount_paid, 'Offer cancelled'); end if;
    perform public.notify(o.user_id, 'Offer cancelled', coalesce(_reason,'This offer was cancelled.'), '/orders/' || o.id);
  end loop;
  perform public.audit('cancel_pool','pool',_pool, jsonb_build_object('reason',_reason));
end $$;
grant execute on function public.admin_cancel_pool(uuid,text) to authenticated;

create or replace function public.admin_close_now(_pool uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.pools set closes_at = least(closes_at, now()) where id = _pool and status = 'open';
  perform public.close_pool(_pool);
  perform public.audit('close_pool_now','pool',_pool);
end $$;
grant execute on function public.admin_close_now(uuid) to authenticated;

create or replace function public.admin_finalise_funding(_pool uuid) returns text language plpgsql security definer set search_path = public as $$
declare res text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  res := public.finalise_funding(_pool);
  perform public.audit('finalise_funding','pool',_pool, jsonb_build_object('result',res));
  return res;
end $$;
grant execute on function public.admin_finalise_funding(uuid) to authenticated;

create or replace function public.admin_record_payment(_order uuid, _amount numeric, _channel_ref text, _note text, _kind text) returns void language plpgsql security definer set search_path = public as $$
declare o public.orders; newpaid numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into o from public.orders where id = _order for update;
  if o.status <> 'confirmed' then raise exception 'Payments can only be recorded on confirmed orders'; end if;
  if o.payment_status = 'paid' then raise exception 'This order is already fully paid'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Enter a positive amount'; end if;
  insert into public.payments(order_id, amount, kind, channel_reference, note, recorded_by) values (_order, _amount, _kind, _channel_ref, _note, auth.uid());
  if _kind = 'verified' then
    newpaid := o.amount_paid + _amount;
    update public.orders set amount_paid = newpaid,
      payment_status = case when newpaid >= o.total then 'paid' else 'under_review' end,
      paid_at = case when newpaid >= o.total then now() else null end where id = _order;
    if newpaid >= o.total then
      perform public.notify(o.user_id, 'Payment confirmed', 'We have verified your payment for order ' || o.ref || '.', '/orders/' || _order);
      if newpaid > o.total then insert into public.refunds(order_id, amount, reason) values (_order, newpaid - o.total, 'Overpayment'); end if;
    end if;
  else
    update public.orders set payment_status = 'under_review' where id = _order;
  end if;
  perform public.audit('record_payment','order',_order, jsonb_build_object('amount',_amount,'kind',_kind,'ref',_channel_ref,'note',_note));
end $$;
grant execute on function public.admin_record_payment(uuid,numeric,text,text,text) to authenticated;

create or replace function public.admin_flag_payment_issue(_order uuid, _note text) returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.orders set payment_status = 'issue' where id = _order and status = 'confirmed' and payment_status <> 'paid' returning * into o;
  if o.id is null then raise exception 'Cannot flag this order'; end if;
  perform public.notify(o.user_id, 'Payment issue', coalesce(_note,'There is a problem with your payment. Please contact KasiPool.'), '/orders/' || _order);
  perform public.audit('payment_issue','order',_order, jsonb_build_object('note',_note));
end $$;
grant execute on function public.admin_flag_payment_issue(uuid,text) to authenticated;

create or replace function public.admin_create_refund(_order uuid, _amount numeric, _reason text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  insert into public.refunds(order_id, amount, reason, recorded_by) values (_order, _amount, _reason, auth.uid());
  perform public.audit('refund_owed','order',_order, jsonb_build_object('amount',_amount,'reason',_reason));
end $$;
grant execute on function public.admin_create_refund(uuid,numeric,text) to authenticated;

create or replace function public.admin_complete_refund(_refund uuid, _reference text) returns void language plpgsql security definer set search_path = public as $$
declare r public.refunds; outstanding numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  update public.refunds set status = 'completed', completed_reference = _reference, completed_at = now(), recorded_by = auth.uid()
    where id = _refund and status = 'owed' returning * into r;
  if r.id is null then raise exception 'Refund already completed or not found'; end if;
  select coalesce(sum(amount),0) into outstanding from public.refunds where order_id = r.order_id and status = 'owed';
  if outstanding = 0 then
    update public.orders set payment_status = 'refunded' where id = r.order_id and status in ('failed','expired','cancelled') and amount_paid > 0;
  end if;
  perform public.notify((select user_id from public.orders where id = r.order_id), 'Refund processed', 'A refund of R' || r.amount || ' has been processed.', '/orders/' || r.order_id);
  perform public.audit('refund_completed','refund',_refund, jsonb_build_object('reference',_reference,'amount',r.amount));
end $$;
grant execute on function public.admin_complete_refund(uuid,text) to authenticated;

create or replace function public.admin_resolve_failed_pool(_pool uuid, _note text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if exists(select 1 from public.refunds r join public.orders o on o.id = r.order_id where o.pool_id = _pool and r.status = 'owed') then
    raise exception 'Complete all outstanding refunds first';
  end if;
  update public.pools set status = 'unsuccessful', outcome_note = coalesce(_note, outcome_note) where id = _pool and status = 'refund_resolution';
  perform public.audit('resolve_failed_pool','pool',_pool, jsonb_build_object('note',_note));
end $$;
grant execute on function public.admin_resolve_failed_pool(uuid,text) to authenticated;

create or replace function public.admin_create_po(_pool uuid, _supplier_ref text, _order_date date, _expected date) returns void language plpgsql security definer set search_path = public as $$
declare p public.pools; c numeric;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into p from public.pools where id = _pool for update;
  if p.status <> 'funded' then raise exception 'Only funded pools can be procured'; end if;
  if p.paid_qty < p.min_qty then raise exception 'Paid quantity is below the minimum'; end if;
  select supplier_cost into c from public.pool_costs where pool_id = _pool;
  insert into public.purchase_orders(pool_id, supplier_id, quantity, unit_cost, total, supplier_ref, order_date, expected_date, created_by)
  values (_pool, p.supplier_id, p.paid_qty, coalesce(c,0), coalesce(c,0) * p.paid_qty, _supplier_ref, coalesce(_order_date, current_date), _expected, auth.uid());
  update public.pools set status = 'procurement' where id = _pool;
  update public.orders set fulfilment_status = 'ordered' where pool_id = _pool and payment_status = 'paid' and status = 'confirmed';
  perform public.audit('create_purchase_order','pool',_pool, jsonb_build_object('qty',p.paid_qty,'supplier_ref',_supplier_ref));
end $$;
grant execute on function public.admin_create_po(uuid,text,date,date) to authenticated;

create or replace function public.admin_receive_stock(_pool uuid, _received int, _note text) returns void language plpgsql security definer set search_path = public as $$
declare po public.purchase_orders; remaining int; o record; give int; pname text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into po from public.purchase_orders where pool_id = _pool for update;
  if po.id is null or po.status <> 'ordered' then raise exception 'No open purchase order for this pool'; end if;
  if _received < 0 then raise exception 'Invalid quantity'; end if;
  update public.purchase_orders set received_qty = _received, discrepancy_note = _note, received_at = now(),
    status = case when _received >= po.quantity then 'received' else 'partially_received' end where id = po.id;
  remaining := _received;
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  for o in select * from public.orders where pool_id = _pool and status = 'confirmed' and payment_status = 'paid' order by paid_at nulls last, confirmed_at loop
    give := least(o.quantity, remaining);
    remaining := remaining - give;
    update public.orders set allocated_qty = give, fulfilment_status = case when give >= o.quantity then 'allocated' else 'short' end where id = o.id;
    if give < o.quantity then
      insert into public.refunds(order_id, amount, reason) values (o.id, (o.quantity - give) * o.unit_price, 'Supplier short delivery: ' || (o.quantity - give) || ' unit(s) not received');
      perform public.notify(o.user_id, 'Stock shortfall', 'The supplier delivered less ' || pname || ' than ordered. A partial refund is due.', '/orders/' || o.id);
    end if;
  end loop;
  update public.pools set status = 'stock_received' where id = _pool;
  perform public.audit('receive_stock','pool',_pool, jsonb_build_object('received',_received,'ordered',po.quantity,'note',_note));
end $$;
grant execute on function public.admin_receive_stock(uuid,int,text) to authenticated;

create or replace function public.admin_mark_ready(_pool uuid) returns int language plpgsql security definer set search_path = public as $$
declare o record; n int := 0; pname text;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if (select status from public.pools where id = _pool) <> 'stock_received' then raise exception 'Record stock receipt first'; end if;
  select name into pname from public.products pr join public.pools pl on pl.product_id = pr.id where pl.id = _pool;
  for o in select * from public.orders where pool_id = _pool and fulfilment_status in ('allocated','short') and allocated_qty > 0 loop
    update public.orders set fulfilment_status = 'ready', ready_at = now(),
      collection_code = upper(substr(md5(random()::text || o.id::text),1,6)) where id = o.id;
    perform public.notify(o.user_id, 'Ready for collection', 'Your ' || pname || ' is ready. Show your collection code at the collection point.', '/orders/' || o.id);
    n := n + 1;
  end loop;
  update public.pools set status = 'ready_for_collection' where id = _pool;
  perform public.audit('mark_ready','pool',_pool, jsonb_build_object('orders',n));
  return n;
end $$;
grant execute on function public.admin_mark_ready(uuid) to authenticated;

create or replace function public.admin_collect(_order uuid, _code text) returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into o from public.orders where id = _order for update;
  if o.fulfilment_status = 'collected' then raise exception 'Already collected on %', to_char(o.collected_at at time zone 'Africa/Johannesburg','DD Mon YYYY HH24:MI'); end if;
  if o.fulfilment_status <> 'ready' then raise exception 'This order is not ready for collection'; end if;
  if upper(trim(_code)) <> o.collection_code then raise exception 'Collection code does not match'; end if;
  update public.orders set fulfilment_status = 'collected', collected_at = now(), collected_by = auth.uid() where id = _order;
  perform public.notify(o.user_id, 'Order completed', 'Order ' || o.ref || ' was collected. Thank you for pooling with KasiPool.', '/orders/' || _order);
  perform public.audit('collect','order',_order, '{}');
  if not exists(select 1 from public.orders where pool_id = o.pool_id and fulfilment_status = 'ready') then
    update public.pools set status = 'completed' where id = o.pool_id and status = 'ready_for_collection';
  end if;
end $$;
grant execute on function public.admin_collect(uuid,text) to authenticated;

-- ===== Settings defaults =====
insert into public.app_settings(key, value) values
 ('payment', '{"configured": false, "method": "EFT (bank transfer)", "bank": "", "account_name": "", "account_number": "", "branch_code": "", "notes": ""}'),
 ('terms', '{"version": "v0.1-draft"}'),
 ('contact', '{"phone": "", "email": "", "whatsapp": ""}');

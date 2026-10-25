-- Team members ask for admin access from /admin/login; an existing admin approves or declines.
-- One request per account. Rows change only through the functions below.

create table public.admin_requests (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 100),
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz
);
create index admin_requests_pending_idx on public.admin_requests (created_at) where status = 'pending';

alter table public.admin_requests enable row level security;
create policy "own or admin read" on public.admin_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- The signed-in user asks for admin access. Business logins (phone numbers) can't.
create or replace function public.request_admin_access(_name text)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  mail text;
begin
  if uid is null then raise exception 'Please log in first'; end if;
  if public.has_role(uid, 'admin') then raise exception 'You already have admin access'; end if;
  if length(trim(coalesce(_name, ''))) < 2 then raise exception 'Enter your name'; end if;
  select email into mail from auth.users where id = uid;
  if mail is null or lower(mail) like '%@phone.kasipool.co.za' then
    raise exception 'Use your email address to ask for admin access';
  end if;
  insert into public.admin_requests (user_id, full_name, email)
  values (uid, trim(_name), lower(mail))
  on conflict (user_id) do update
    set full_name = excluded.full_name, status = 'pending', created_at = now(),
        reviewed_by = null, reviewed_at = null;
  perform public.audit('request_admin', 'user', uid, jsonb_build_object('email', lower(mail)));
end $$;
revoke execute on function public.request_admin_access(text) from public, anon;
grant execute on function public.request_admin_access(text) to authenticated;

-- An admin approves (grants the admin role) or declines a waiting request.
create or replace function public.admin_review_access(_user uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r public.admin_requests;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  select * into r from public.admin_requests where user_id = _user for update;
  if r.user_id is null or r.status <> 'pending' then
    raise exception 'This request has already been handled';
  end if;
  if _approve then
    insert into public.user_roles (user_id, role) values (_user, 'admin') on conflict do nothing;
  end if;
  update public.admin_requests
    set status = case when _approve then 'approved' else 'declined' end,
        reviewed_by = auth.uid(), reviewed_at = now()
    where user_id = _user;
  perform public.audit(case when _approve then 'grant_admin' else 'decline_admin' end, 'user', _user,
    jsonb_build_object('email', r.email));
end $$;
revoke execute on function public.admin_review_access(uuid, boolean) from public, anon;
grant execute on function public.admin_review_access(uuid, boolean) to authenticated;

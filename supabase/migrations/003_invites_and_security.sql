-- ============================================================
-- AllyTracker — Invites, RPCs, and Security Hardening
-- ============================================================
-- Closes audit findings:
--   #1.1  Client-side onboarding (replace with create_org_for_user RPC)
--   #1.2  Helpers not security definer (recreated with proper search_path)
--   #1.3  Self-promotion to admin (BEFORE UPDATE trigger)
--   #1.5  Trigger trusts metadata.role (now hardcoded to 'admin' for signup,
--         and overridden by invite role if invite exists)
--   New:  Invite flow — admin invites teammates, trigger auto-accepts on signup
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. Fix helper functions to be SECURITY DEFINER
-- ============================================================
-- Without security definer, these run under the caller's RLS context
-- and can recurse when called from within a policy on `members`.

create or replace function auth_member()
returns members
language sql stable
security definer
set search_path = public, auth
as $$
  select * from members where user_id = auth.uid() limit 1;
$$;

create or replace function auth_org_id()
returns uuid
language sql stable
security definer
set search_path = public, auth
as $$
  select org_id from members where user_id = auth.uid() limit 1;
$$;

create or replace function auth_is_admin()
returns boolean
language sql stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from members
    where user_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function auth_member()    to authenticated;
grant execute on function auth_org_id()    to authenticated;
grant execute on function auth_is_admin()  to authenticated;

-- ============================================================
-- 2. Trigger to prevent self-escalation on members
-- ============================================================
-- Blocks any user from changing their own role, org_id, or user_id.
-- Admins updating OTHER members (where auth.uid() != old.user_id) pass through.
-- Security-definer functions (system) where auth.uid() is NULL pass through.

create or replace function members_prevent_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if old.user_id = auth.uid() then
    if new.role is distinct from old.role then
      raise exception 'cannot change own role' using errcode = '42501';
    end if;
    if new.org_id is distinct from old.org_id then
      raise exception 'cannot change own org_id' using errcode = '42501';
    end if;
    if new.user_id is distinct from old.user_id then
      raise exception 'cannot change own user_id' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists members_prevent_self_escalation_trg on members;
create trigger members_prevent_self_escalation_trg
  before update on members
  for each row execute function members_prevent_self_escalation();

-- ============================================================
-- 3. Invites table
-- ============================================================
create table if not exists invites (
  id          uuid        primary key default gen_random_uuid(),
  org_id      uuid        not null references organizations(id) on delete cascade,
  email       text        not null,
  role        text        not null default 'employee'
                check (role in ('admin', 'employee')),
  full_name   text,
  token       text        not null unique
                default encode(gen_random_bytes(24), 'hex'),
  invited_by  uuid        references members(id) on delete set null,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists invites_email_idx on invites (lower(email));
create index if not exists invites_org_idx   on invites (org_id);

alter table invites enable row level security;

-- Admins of an org can read invites for their org. All mutations go through RPCs.
drop policy if exists "admins read org invites" on invites;
create policy "admins read org invites"
  on invites for select
  using (org_id = auth_org_id() and auth_is_admin());

-- ============================================================
-- 4. RPC: preview_invite (anon-readable, for the accept page)
-- ============================================================
create or replace function preview_invite(p_token text)
returns table(
  org_name   text,
  role       text,
  email      text,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select o.name, i.role, i.email, i.expires_at
  from invites i
  join organizations o on o.id = i.org_id
  where i.token = p_token
    and i.accepted_at is null
    and i.expires_at > now()
  limit 1;
$$;

grant execute on function preview_invite(text) to anon, authenticated;

-- ============================================================
-- 5. RPC: create_invite (admin-only)
-- ============================================================
create or replace function create_invite(
  p_email     text,
  p_role      text default 'employee',
  p_full_name text default null
) returns invites
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin   members;
  v_invite  invites;
  v_email   text := lower(trim(p_email));
begin
  if auth.uid() is null then
    raise exception 'must be signed in' using errcode = '42501';
  end if;

  select * into v_admin
  from members
  where user_id = auth.uid() and role = 'admin'
  limit 1;

  if v_admin.id is null then
    raise exception 'only admins can create invites' using errcode = '42501';
  end if;

  if p_role not in ('admin', 'employee') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'invalid email' using errcode = '22023';
  end if;

  -- Block invite to someone already in this org
  if exists (
    select 1 from members m
    where m.org_id = v_admin.org_id and lower(m.email) = v_email
  ) then
    raise exception 'user is already a member of this org' using errcode = '23505';
  end if;

  -- Expire any pending invite for the same (org, email) so only one is active
  update invites
     set expires_at = now()
   where org_id = v_admin.org_id
     and lower(email) = v_email
     and accepted_at is null
     and expires_at > now();

  insert into invites (org_id, email, role, full_name, invited_by)
  values (v_admin.org_id, v_email, p_role, p_full_name, v_admin.id)
  returning * into v_invite;

  return v_invite;
end;
$$;

grant execute on function create_invite(text, text, text) to authenticated;

-- ============================================================
-- 6. RPC: revoke_invite (admin-only)
-- ============================================================
create or replace function revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin members;
begin
  if auth.uid() is null then
    raise exception 'must be signed in' using errcode = '42501';
  end if;

  select * into v_admin
  from members
  where user_id = auth.uid() and role = 'admin'
  limit 1;

  if v_admin.id is null then
    raise exception 'only admins can revoke invites' using errcode = '42501';
  end if;

  update invites
     set expires_at = now()
   where id = p_invite_id
     and org_id = v_admin.org_id
     and accepted_at is null;
end;
$$;

grant execute on function revoke_invite(uuid) to authenticated;

-- ============================================================
-- 7. RPC: accept_invite (authenticated)
-- ============================================================
-- For users who already have an auth session and click an invite link.
-- New signups via invite are handled by handle_new_user trigger below.

create or replace function accept_invite(p_token text)
returns members
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite  invites;
  v_email   text;
  v_member  members;
begin
  if auth.uid() is null then
    raise exception 'must be signed in to accept invite' using errcode = '42501';
  end if;

  select * into v_invite
  from invites
  where token = p_token
    and accepted_at is null
    and expires_at > now()
  limit 1;

  if v_invite.id is null then
    raise exception 'invite not found or expired' using errcode = '22023';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  if lower(v_email) is distinct from lower(v_invite.email) then
    raise exception 'invite email does not match signed-in user' using errcode = '42501';
  end if;

  if exists (select 1 from members where user_id = auth.uid()) then
    raise exception 'user is already a member of an org' using errcode = '23505';
  end if;

  insert into members (org_id, user_id, role, full_name, email, avatar_color)
  values (
    v_invite.org_id,
    auth.uid(),
    v_invite.role,
    coalesce(v_invite.full_name, split_part(v_email, '@', 1)),
    v_email,
    '#FF8A4C'
  ) returning * into v_member;

  update invites set accepted_at = now() where id = v_invite.id;

  return v_member;
end;
$$;

grant execute on function accept_invite(text) to authenticated;

-- ============================================================
-- 8. RPC: create_org_for_user (authenticated — for OAuth onboarding)
-- ============================================================
-- Replaces the broken client-side INSERTs in app/auth/onboarding/page.tsx.

create or replace function create_org_for_user(
  p_company_name text,
  p_full_name    text default null
) returns members
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email   text;
  v_meta_name text;
  v_org_id  uuid;
  v_slug    text;
  v_member  members;
begin
  if auth.uid() is null then
    raise exception 'must be signed in' using errcode = '42501';
  end if;

  if p_company_name is null or trim(p_company_name) = '' then
    raise exception 'company name required' using errcode = '22023';
  end if;

  if exists (select 1 from members where user_id = auth.uid()) then
    raise exception 'user is already a member of an org' using errcode = '23505';
  end if;

  select email, raw_user_meta_data->>'full_name'
    into v_email, v_meta_name
    from auth.users
   where id = auth.uid();

  v_slug := lower(regexp_replace(p_company_name, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 6);

  insert into organizations (name, slug, plan)
  values (trim(p_company_name), v_slug, 'team')
  returning id into v_org_id;

  insert into members (org_id, user_id, role, full_name, email, avatar_color)
  values (
    v_org_id,
    auth.uid(),
    'admin',
    coalesce(p_full_name, v_meta_name, split_part(v_email, '@', 1)),
    v_email,
    '#FF8A4C'
  ) returning * into v_member;

  return v_member;
end;
$$;

grant execute on function create_org_for_user(text, text) to authenticated;

-- ============================================================
-- 9. Updated handle_new_user trigger — auto-accept invites
-- ============================================================
-- Order of precedence:
--   1. Pending invite for this email → join that org with invite's role
--   2. company_name in signup metadata → create new org as admin
--   3. Otherwise → no-op (OAuth user, onboarding page handles via RPC)
-- Role from metadata is IGNORED (hardcoded to 'admin' for new-org path).

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite     public.invites;
  v_company    text;
  v_full_name  text;
  v_org_id     uuid;
  v_slug       text;
begin
  v_company   := new.raw_user_meta_data->>'company_name';
  v_full_name := new.raw_user_meta_data->>'full_name';

  -- 1. Invite path
  select * into v_invite
    from public.invites
   where lower(email) = lower(new.email)
     and accepted_at is null
     and expires_at > now()
   order by created_at desc
   limit 1;

  if v_invite.id is not null then
    insert into public.members (org_id, user_id, role, full_name, email, avatar_color)
    values (
      v_invite.org_id,
      new.id,
      v_invite.role,
      coalesce(v_invite.full_name, v_full_name, split_part(new.email, '@', 1)),
      new.email,
      '#FF8A4C'
    );
    update public.invites set accepted_at = now() where id = v_invite.id;
    return new;
  end if;

  -- 2. New-org signup path (only if company name was provided)
  if v_company is null or v_company = '' then
    return new;
  end if;

  v_slug := lower(regexp_replace(v_company, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 6);

  insert into public.organizations (name, slug, plan)
  values (v_company, v_slug, 'team')
  returning id into v_org_id;

  insert into public.members (org_id, user_id, role, full_name, email, avatar_color)
  values (
    v_org_id,
    new.id,
    'admin',  -- hardcoded; never trust metadata.role
    coalesce(v_full_name, split_part(new.email, '@', 1)),
    new.email,
    '#FF8A4C'
  );

  return new;
end;
$$;

-- (trigger on_auth_user_created already exists from 002, just point at the new function)

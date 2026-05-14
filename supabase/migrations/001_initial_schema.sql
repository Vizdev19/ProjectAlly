-- ============================================================
-- AllyTracker — Initial Schema
-- ============================================================
-- Multi-tenancy model:
--   organizations → members → tracking_sessions → screenshots
-- Each row carries org_id. RLS enforces org isolation.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Organizations ─────────────────────────────────────────────
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  plan        text        not null default 'solo'
                check (plan in ('solo', 'team', 'org')),
  created_at  timestamptz not null default now()
);

-- ── Members ───────────────────────────────────────────────────
-- Links auth.users → organizations. One user can belong to one org.
create table members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid        not null references organizations(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  role        text        not null default 'employee'
                check (role in ('admin', 'employee')),
  full_name   text        not null,
  email       text        not null,
  avatar_color text       not null default '#FF8A4C',
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

-- ── Tracking Sessions ─────────────────────────────────────────
create table tracking_sessions (
  id              uuid        primary key default gen_random_uuid(),
  org_id          uuid        not null references organizations(id) on delete cascade,
  member_id       uuid        not null references members(id) on delete cascade,
  project         text,
  status          text        not null default 'tracking'
                    check (status in ('tracking', 'paused', 'ended')),
  started_at      timestamptz not null default now(),
  paused_at       timestamptz,
  ended_at        timestamptz,
  elapsed_seconds integer     not null default 0,
  created_at      timestamptz not null default now()
);

create index on tracking_sessions (org_id, member_id);
create index on tracking_sessions (status);

-- ── Screenshots ───────────────────────────────────────────────
-- Metadata only. Actual image files live in Supabase Storage.
-- Two buckets:
--   private-screenshots  → employee-only, pending review
--   submitted-screenshots → employer-visible, post-approval
create table screenshots (
  id                    uuid        primary key default gen_random_uuid(),
  org_id                uuid        not null references organizations(id) on delete cascade,
  member_id             uuid        not null references members(id) on delete cascade,
  session_id            uuid        references tracking_sessions(id) on delete set null,

  -- Storage paths
  private_path          text        not null, -- private-screenshots/{org_id}/{member_id}/{id}.png
  submitted_path        text,                 -- submitted-screenshots/{org_id}/{member_id}/{id}.png (set on approval)

  -- Capture metadata
  captured_at           timestamptz not null default now(),
  app_name              text,
  window_title          text,

  -- Employee review
  status                text        not null default 'pending'
                          check (status in ('pending', 'approved', 'removed')),
  note                  text,        -- employee's private note, never shown to admin
  reviewed_at           timestamptz, -- when employee made keep/remove decision
  submitted_at          timestamptz, -- when approved copy was moved to submitted bucket

  created_at            timestamptz not null default now()
);

create index on screenshots (org_id, member_id, status);
create index on screenshots (session_id);
create index on screenshots (captured_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table organizations      enable row level security;
alter table members            enable row level security;
alter table tracking_sessions  enable row level security;
alter table screenshots        enable row level security;

-- ── Helper: get calling user's member row ────────────────────
create or replace function auth_member()
returns members
language sql stable
as $$
  select * from members where user_id = auth.uid() limit 1;
$$;

-- ── Helper: get calling user's org_id ───────────────────────
create or replace function auth_org_id()
returns uuid
language sql stable
as $$
  select org_id from members where user_id = auth.uid() limit 1;
$$;

-- ── Helper: is calling user an admin? ────────────────────────
create or replace function auth_is_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from members
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ── organizations ─────────────────────────────────────────────
-- Any member can read their org
create policy "members read own org"
  on organizations for select
  using (id = auth_org_id());

-- Admins can update their org
create policy "admins update org"
  on organizations for update
  using (id = auth_org_id() and auth_is_admin());

-- ── members ───────────────────────────────────────────────────
-- Everyone in the org can see all members (for dashboard)
create policy "members read org members"
  on members for select
  using (org_id = auth_org_id());

-- Admins can invite/update/remove members
create policy "admins manage members"
  on members for all
  using (org_id = auth_org_id() and auth_is_admin());

-- Members can update their own profile
create policy "members update self"
  on members for update
  using (user_id = auth.uid());

-- ── tracking_sessions ─────────────────────────────────────────
-- Employees can manage their own sessions
create policy "employees manage own sessions"
  on tracking_sessions for all
  using (member_id = (auth_member()).id);

-- Admins can read all sessions in their org
create policy "admins read org sessions"
  on tracking_sessions for select
  using (org_id = auth_org_id() and auth_is_admin());

-- ── screenshots ───────────────────────────────────────────────
-- Employees: full control over their own screenshots
create policy "employees manage own screenshots"
  on screenshots for all
  using (member_id = (auth_member()).id);

-- Admins: can only see approved screenshots (never pending/removed)
create policy "admins read approved screenshots"
  on screenshots for select
  using (
    org_id = auth_org_id()
    and auth_is_admin()
    and status = 'approved'
  );

-- ============================================================
-- Storage Buckets
-- ============================================================

-- private-screenshots: employee stores pending captures
insert into storage.buckets (id, name, public)
values ('private-screenshots', 'private-screenshots', false);

-- submitted-screenshots: employer-visible after employee approves
insert into storage.buckets (id, name, public)
values ('submitted-screenshots', 'submitted-screenshots', false);

-- ── private-screenshots policies ─────────────────────────────
-- Employees can upload to their own folder: {org_id}/{member_id}/*
create policy "employees upload private screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'private-screenshots'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and (storage.foldername(name))[2] = (auth_member()).id::text
  );

-- Employees can read their own private screenshots
create policy "employees read own private screenshots"
  on storage.objects for select
  using (
    bucket_id = 'private-screenshots'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and (storage.foldername(name))[2] = (auth_member()).id::text
  );

-- Employees can delete their own private screenshots (on remove)
create policy "employees delete own private screenshots"
  on storage.objects for delete
  using (
    bucket_id = 'private-screenshots'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and (storage.foldername(name))[2] = (auth_member()).id::text
  );

-- ── submitted-screenshots policies ───────────────────────────
-- Employees can upload to submitted bucket (on approval)
create policy "employees upload submitted screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'submitted-screenshots'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and (storage.foldername(name))[2] = (auth_member()).id::text
  );

-- Admins can read all submitted screenshots in their org
create policy "admins read submitted screenshots"
  on storage.objects for select
  using (
    bucket_id = 'submitted-screenshots'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and auth_is_admin()
  );

-- Employees can read their own submitted screenshots
create policy "employees read own submitted screenshots"
  on storage.objects for select
  using (
    bucket_id = 'submitted-screenshots'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and (storage.foldername(name))[2] = (auth_member()).id::text
  );

-- ============================================================
-- Realtime
-- ============================================================
-- Allow admins to subscribe to live session + screenshot updates
alter publication supabase_realtime add table tracking_sessions;
alter publication supabase_realtime add table screenshots;

-- ============================================================
-- PHASE 1 — Workspaces (organisations) + membership + backfill
-- Run in Supabase -> SQL Editor.
-- This only adds structure and assigns existing data; it does NOT
-- yet change how the app reads data (that is Phase 4).
-- ============================================================

-- 1) The workspace itself
create table if not exists public.organisations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'My Workspace',
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2) Who belongs to which workspace, and their role
create table if not exists public.organisation_members (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'member' check (role in ('owner','member')),
  created_at      timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create index if not exists idx_org_members_user on public.organisation_members(user_id);
create index if not exists idx_org_members_org  on public.organisation_members(organisation_id);

-- 3) Link projects to a workspace (child tables stay scoped via their project)
alter table public.projects
  add column if not exists organisation_id uuid references public.organisations(id) on delete cascade;

create index if not exists idx_projects_org on public.projects(organisation_id);

-- 4) RLS on the new tables (members can read their own workspace + membership).
--    Writes happen via the signup trigger / service role, so no write policy yet.
alter table public.organisations        enable row level security;
alter table public.organisation_members enable row level security;

drop policy if exists "members read their orgs" on public.organisations;
create policy "members read their orgs" on public.organisations
  for select to authenticated
  using (
    id in (select organisation_id from public.organisation_members where user_id = auth.uid())
  );

drop policy if exists "read own membership" on public.organisation_members;
create policy "read own membership" on public.organisation_members
  for select to authenticated
  using (user_id = auth.uid());

-- 5) BACKFILL — attach existing data to your account's workspace.
--    >>> REPLACE the email below with the account that owns the existing project <<<
do $$
declare
  v_owner uuid;
  v_org   uuid;
begin
  select id into v_owner
  from auth.users
  where email = 'REPLACE_WITH_YOUR_LOGIN_EMAIL'
  limit 1;

  if v_owner is null then
    raise exception 'No auth user found with that email - check the address and retry';
  end if;

  insert into public.organisations (name, owner_id)
  values ('My Workspace', v_owner)
  returning id into v_org;

  insert into public.organisation_members (organisation_id, user_id, role)
  values (v_org, v_owner, 'owner');

  update public.projects
  set organisation_id = v_org
  where organisation_id is null;

  raise notice 'Backfill done: workspace % owned by %, existing projects assigned.', v_org, v_owner;
end $$;

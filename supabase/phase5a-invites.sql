-- ============================================================
-- PHASE 5a — Invitations: table + invite-aware signup trigger
-- Run in Supabase -> SQL Editor.
-- ============================================================

-- 1) Invites: an owner invites an email into their workspace.
create table if not exists public.invites (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  email           text not null,
  role            text not null default 'member' check (role in ('owner','member')),
  status          text not null default 'pending' check (status in ('pending','accepted','revoked')),
  invited_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  accepted_at     timestamptz
);

create index if not exists idx_invites_email on public.invites (lower(email));
create index if not exists idx_invites_org   on public.invites (organisation_id);

-- 2) RLS: only owners of the workspace can see/manage its invites.
alter table public.invites enable row level security;

drop policy if exists "owners manage invites" on public.invites;
create policy "owners manage invites" on public.invites
  for all to authenticated
  using (
    organisation_id in (
      select organisation_id from public.organisation_members
      where user_id = auth.uid() and role = 'owner'
    )
  )
  with check (
    organisation_id in (
      select organisation_id from public.organisation_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- 3) Update the signup trigger: invited emails JOIN the inviting workspace
--    (with the invite's role) and do NOT get a personal workspace.
create or replace function public.handle_new_user_workspace()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org    uuid;
  v_name   text;
  v_invite record;
  v_found  boolean := false;
begin
  -- Honour any pending invites for this email.
  for v_invite in
    select * from public.invites
    where lower(email) = lower(new.email) and status = 'pending'
  loop
    insert into public.organisation_members (organisation_id, user_id, role)
    values (v_invite.organisation_id, new.id, v_invite.role)
    on conflict (organisation_id, user_id) do nothing;

    update public.invites
    set status = 'accepted', accepted_at = now()
    where id = v_invite.id;

    v_found := true;
  end loop;

  if v_found then
    return new;  -- joined an existing workspace; no personal one
  end if;

  -- No invite: create the user's own workspace.
  v_name := coalesce(
    nullif(new.raw_user_meta_data->>'organisation', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    'My Workspace'
  );

  insert into public.organisations (name, owner_id)
  values (v_name, new.id)
  returning id into v_org;

  insert into public.organisation_members (organisation_id, user_id, role)
  values (v_org, new.id, 'owner');

  return new;
end;
$$;

revoke execute on function public.handle_new_user_workspace() from public, anon, authenticated;

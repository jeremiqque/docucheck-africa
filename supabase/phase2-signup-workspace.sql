-- ============================================================
-- PHASE 2 — Auto-create a workspace for every new signup
-- Run in Supabase -> SQL Editor.
-- Adds a SEPARATE trigger on auth.users (your existing profile
-- trigger is left untouched).
-- ============================================================

create or replace function public.handle_new_user_workspace()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org  uuid;
  v_name text;
begin
  -- Workspace name: use the "organisation" from signup if given,
  -- otherwise the person's name, otherwise a default.
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

-- Only the trigger should call this, not clients.
revoke execute on function public.handle_new_user_workspace() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace
  after insert on auth.users
  for each row execute function public.handle_new_user_workspace();

-- Verify after a test signup:
--   select * from public.organisations order by created_at desc limit 5;
--   select * from public.organisation_members order by created_at desc limit 5;

-- ============================================================
-- PHASE 3 — Workspace-scoped RLS policies
-- Run in Supabase -> SQL Editor.
-- Replaces the temporary "USING (true)" policies with real ones:
--   * projects: only rows in a workspace you belong to
--   * child tables: scoped via their parent project's workspace
-- Clears the 5 "RLS Policy Always True" advisor warnings.
-- ============================================================

-- Helper: is the current user a member of the workspace that owns this project?
-- SECURITY DEFINER so it can read projects/members without recursive RLS.
create or replace function public.user_in_project(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.projects p
    join public.organisation_members m on m.organisation_id = p.organisation_id
    where p.id = p_project
      and m.user_id = auth.uid()
  );
$$;

-- Projects: scope by workspace membership
drop policy if exists "authenticated_all" on public.projects;
drop policy if exists "members access projects" on public.projects;
create policy "members access projects" on public.projects
  for all to authenticated
  using (
    organisation_id in (select organisation_id from public.organisation_members where user_id = auth.uid())
  )
  with check (
    organisation_id in (select organisation_id from public.organisation_members where user_id = auth.uid())
  );

-- Child tables: scope via the parent project's workspace
do $$
declare
  t text;
begin
  foreach t in array array['documents','alerts','audit_logs','compliance_checklist']
  loop
    execute format('drop policy if exists "authenticated_all" on public.%I;', t);
    execute format('drop policy if exists "members access %I" on public.%I;', t, t);
    execute format(
      'create policy "members access %I" on public.%I for all to authenticated using (public.user_in_project(project_id)) with check (public.user_in_project(project_id));',
      t, t
    );
  end loop;
end $$;

-- Verify afterwards:
--   select tablename, policyname, qual from pg_policies
--   where schemaname='public' and tablename in
--     ('projects','documents','alerts','audit_logs','compliance_checklist');

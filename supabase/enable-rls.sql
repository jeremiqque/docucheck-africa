-- ============================================================
-- DocuCheck Africa: re-enable Row Level Security
-- Run this in Supabase -> SQL Editor.
--
-- Model:
--   * Server API routes use the SERVICE-ROLE key, which bypasses RLS.
--   * Logged-in browser reads/writes are allowed via the "authenticated" policy.
--   * The public anon key with NO login gets NO access (closes the hole).
--
-- Note: this does not yet scope rows per user/organisation. Any signed-in
-- user can still read all rows. Per-org isolation is a later step.
-- ============================================================

do $$
declare
  t   text;
  pol record;
  tables text[] := array[
    'projects',
    'documents',
    'alerts',
    'audit_logs',
    'compliance_checklist'
  ];
begin
  foreach t in array tables
  loop
    -- 1) drop any existing (stale dev) policies on the table
    for pol in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I;', pol.policyname, t);
    end loop;

    -- 2) turn RLS on
    execute format('alter table public.%I enable row level security;', t);

    -- 3) allow signed-in users full access (anon = blocked)
    execute format(
      'create policy "authenticated_all" on public.%I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- Verify afterwards:
--   select tablename, rowsecurity from pg_tables where schemaname='public';
--   select tablename, policyname, roles from pg_policies where schemaname='public';

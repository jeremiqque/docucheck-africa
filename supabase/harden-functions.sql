-- ============================================================
-- DocuCheck Africa: harden the signup trigger function
-- Run in Supabase -> SQL Editor. Clears 3 advisor warnings.
-- (handle_new_user is the trigger that creates a profile row on signup.)
-- ============================================================

-- 1) Pin a non-mutable search_path (fixes "Function Search Path Mutable").
alter function public.handle_new_user() set search_path = public, pg_temp;

-- 2) The function is only meant to run via its trigger, not be called
--    directly. Revoking execute clears the two "SECURITY DEFINER callable"
--    warnings; the trigger keeps working (it runs with definer rights).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

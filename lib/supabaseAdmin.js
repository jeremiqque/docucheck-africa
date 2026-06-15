import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key.
// NEVER import this into client components. The key must stay server-side.
let cached = null;

export function getSupabaseAdmin() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

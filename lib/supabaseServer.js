import { createClient } from "@supabase/supabase-js";

// A Supabase client that runs AS the logged-in user, so RLS applies.
// Built from the access token in the request's Authorization header.
export function getSupabaseForToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

// Extract the bearer token from a request, or null.
export function getBearerToken(request) {
  const h = request.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

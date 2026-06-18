import supabase from "@/lib/supabaseClient";

// fetch() that attaches the current user's Supabase access token so the
// API route can run queries as this user (RLS does the data scoping).
export async function apiFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { ...options, headers });
}

"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

/**
 * Client auth hook.
 * Reads the persisted Supabase session and the matching `profiles` row
 * (full_name, role, organisation). Used by the sidebar for the user block
 * and to gate the admin-only nav.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile(u) {
      if (!u) {
        if (active) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role, organisation")
        .eq("id", u.id)
        .single();
      if (active) setProfile(data ?? null);
    }

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      const u = session?.user ?? null;
      setUser(u);
      await loadProfile(u);
      if (active) setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  // Display helpers with sensible fallbacks
  const displayName = profile?.full_name || user?.email || "DocuCheck user";
  const role = profile?.role || "user";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return { user, profile, loading, logout, displayName, role, initials };
}

"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

/**
 * Client auth hook.
 * Reads the persisted Supabase session, the matching `profiles` row, and
 * whether the user OWNS a workspace (organisation_members role = 'owner').
 * Workspace ownership is what gates the Admin page + invites.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [organisationId, setOrganisationId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile(u) {
      if (!u) {
        if (active) {
          setProfile(null);
          setIsOwner(false);
          setOrganisationId(null);
        }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role, organisation")
        .eq("id", u.id)
        .single();
      if (active) setProfile(data ?? null);

      const { data: mem } = await supabase
        .from("organisation_members")
        .select("organisation_id, role")
        .eq("user_id", u.id)
        .eq("role", "owner")
        .limit(1)
        .maybeSingle();
      if (active) {
        setIsOwner(!!mem);
        setOrganisationId(mem?.organisation_id ?? null);
      }
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

  const displayName = profile?.full_name || user?.email || "DocuCheck user";
  const role = profile?.role || "user";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return { user, profile, loading, logout, displayName, role, initials, isOwner, organisationId };
}

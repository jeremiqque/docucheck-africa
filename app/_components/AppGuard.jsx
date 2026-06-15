"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

/**
 * Protects the authenticated app shell. Redirects to the login page when
 * there is no Supabase session. Shows a minimal loader while the session
 * is being resolved so protected content never flashes.
 */
export default function AppGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <span className="h-6 w-6 animate-spin rounded-pill border-2 border-cloud border-t-ink" />
      </div>
    );
  }
  if (!user) return null;
  return children;
}

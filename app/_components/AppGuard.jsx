"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import BrandLoader from "./BrandLoader";

/**
 * Protects the authenticated app shell. Redirects to the login page when
 * there is no Supabase session. Shows a minimal loader while the session
 * is being resolved so protected content never flashes.
 */
export default function AppGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
<BrandLoader fullscreen />
    );
  }
  if (!user) return null;
  return children;
}

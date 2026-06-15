import AppShell from "@/app/_components/AppShell";
import AppGuard from "@/app/_components/AppGuard";

/**
 * Authenticated app shell — responsive sidebar + content area.
 * AppGuard redirects to login when there is no session.
 * The login page lives at app/page.js (outside this group) so it has no shell.
 */
export default function AppLayout({ children }) {
  return (
    <AppGuard>
      <AppShell>{children}</AppShell>
    </AppGuard>
  );
}

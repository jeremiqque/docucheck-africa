"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/**
 * Responsive app shell.
 * Desktop (lg+): a fixed icon-rail sidebar that expands on hover (overlaying
 * content, so nothing shifts). The content column reserves the 72px rail.
 * Mobile: the sidebar is an off-canvas drawer opened from the top bar.
 */
export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar mobileOpen={mobileOpen} onClose={close} />

      {/* Scrim (mobile only, when drawer open) */}
      {mobileOpen && (
        <div onClick={close} className="fixed inset-0 z-40 bg-ink/30 lg:hidden" aria-hidden="true" />
      )}

      <div className="flex min-h-screen flex-col lg:pl-[72px]">
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

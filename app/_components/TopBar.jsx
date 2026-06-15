"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useAuth } from "./useAuth";
import { Menu01Icon, Search01Icon, Notification01Icon, Logout01Icon, ArrowDown01Icon, UserIcon } from "./icons";

const LABELS = {
  dashboard: "Dashboard",
  projects: "Projects",
  upload: "Compliance check",
  reports: "Reports",
  alerts: "Alerts",
  admin: "Admin",
  new: "New project",
};

const NAV_TARGETS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Compliance check", href: "/upload" },
  { label: "Reports", href: "/reports" },
  { label: "Alerts", href: "/alerts" },
  { label: "Admin", href: "/admin" },
];

function toCrumbs(pathname) {
  const segs = pathname.split("/").filter(Boolean);
  if (!segs.length) return ["Dashboard"];
  return segs.map((s, i) =>
    LABELS[s] ? LABELS[s] : segs[i - 1] === "projects" ? "Detail" : s
  );
}

export default function TopBar({ onMenu }) {
  const pathname = usePathname();
  const router = useRouter();
  const { displayName, role, logout } = useAuth();

  const crumbs = toCrumbs(pathname);
  const current = crumbs[crumbs.length - 1];

  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // unread alerts badge
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { count } = await supabase
          .from("alerts")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false);
        if (active) setUnread(count ?? 0);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [pathname]);

  // ⌘K / Ctrl+K to open search
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/");
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-cloud bg-paper px-4 lg:px-6">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-sm text-ink transition-colors hover:bg-mist lg:hidden"
        >
          <Menu01Icon size={22} />
        </button>

        {/* Breadcrumb (desktop) */}
        <nav className="hidden min-w-0 items-center gap-1.5 text-sm lg:flex" aria-label="Breadcrumb">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={i} className="flex items-center gap-1.5">
                <span className={last ? "font-medium text-ink" : "text-slate"}>{c}</span>
                {!last && <span className="text-cloud">/</span>}
              </span>
            );
          })}
        </nav>

        {/* Current page title (mobile) */}
        <span className="truncate font-display text-base font-bold text-ink lg:hidden">{current}</span>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Search */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="flex items-center gap-2 rounded-md border border-cloud bg-mist px-2.5 py-1.5 text-sm text-slate transition-colors hover:border-graphite sm:min-w-[200px]"
          >
            <Search01Icon size={16} />
            <span className="hidden sm:inline">Search…</span>
            <span className="ml-auto hidden rounded-sm border border-cloud bg-paper px-1.5 py-0.5 text-[10px] font-medium text-slate sm:inline">
              ⌘K
            </span>
          </button>

          {/* Notifications */}
          <Link
            href="/alerts"
            aria-label="Alerts"
            className="relative grid h-9 w-9 place-items-center rounded-sm text-ink transition-colors hover:bg-mist"
          >
            <Notification01Icon size={20} />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-pill bg-fail px-1 text-[10px] font-semibold leading-none text-paper">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          {/* Avatar menu - opens on hover, closes on leave */}
          <div
            className="relative"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-mist"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-ink text-paper">
                <UserIcon size={18} />
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-[13px] font-medium leading-tight text-ink">{displayName}</span>
                <span className="block text-[11px] capitalize leading-tight text-slate">{role}</span>
              </span>
              <ArrowDown01Icon size={16} className="hidden text-slate sm:block" />
            </button>

            {menuOpen && (
              /* pt-2 bridges the gap so moving from the button to the menu doesn't close it */
              <div className="absolute right-0 top-full z-50 pt-2">
                <div className="w-56 overflow-hidden rounded-md border border-cloud bg-paper shadow-[rgba(26,26,26,0.12)_0px_8px_24px]">
                  <div className="border-b border-cloud px-4 py-3">
                    <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                    <p className="truncate text-xs capitalize text-slate">{role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-mist"
                  >
                    <Logout01Icon size={18} className="text-slate" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {paletteOpen && <SearchPalette onClose={() => setPaletteOpen(false)} />}
    </>
  );
}

/* ── ⌘K search palette ── */
function SearchPalette({ onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    (async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (res.ok) setProjects(data.projects ?? []);
      } catch {
        /* ignore */
      }
    })();
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const navMatches = NAV_TARGETS.filter((n) => n.label.toLowerCase().includes(q));
  const projMatches = projects
    .filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, 6)
    .map((p) => ({ label: p.name, href: `/projects/${p.id}`, hint: "Project" }));

  const results = [...navMatches.map((n) => ({ ...n, hint: "Page" })), ...projMatches];

  function go(href) {
    onClose();
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/30 px-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-lg border border-cloud bg-paper shadow-[rgba(26,26,26,0.12)_0px_8px_24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-cloud px-4">
          <Search01Icon size={18} className="text-slate" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and projects…"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate"
          />
          <kbd className="rounded-sm border border-cloud px-1.5 py-0.5 text-[10px] text-slate">Esc</kbd>
        </div>
        <ul className="max-h-[320px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate">No matches.</li>
          ) : (
            results.map((r, i) => (
              <li key={r.href + i}>
                <button
                  type="button"
                  onClick={() => go(r.href)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-mist"
                >
                  <span className="truncate">{r.label}</span>
                  <span className="ml-3 shrink-0 text-xs text-slate">{r.hint}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

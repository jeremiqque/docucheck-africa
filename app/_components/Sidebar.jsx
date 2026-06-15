"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./useAuth";
import {
  DashboardSquare01Icon,
  FolderLibraryIcon,
  CheckmarkBadge01Icon,
  DocumentValidationIcon,
  Notification01Icon,
  UserMultipleIcon,
  Cancel01Icon,
} from "./icons";

const NAV_GROUPS = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard", label: "Dashboard", Icon: DashboardSquare01Icon },
      { href: "/projects", label: "Projects", Icon: FolderLibraryIcon },
      { href: "/upload", label: "Compliance check", Icon: CheckmarkBadge01Icon },
    ],
  },
  {
    label: "REPORTS",
    items: [
      { href: "/reports", label: "Reports", Icon: DocumentValidationIcon },
      { href: "/alerts", label: "Alerts", Icon: Notification01Icon },
    ],
  },
  {
    label: "SYSTEM",
    adminOnly: true,
    items: [{ href: "/admin", label: "Admin", Icon: UserMultipleIcon }],
  },
];

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const pathname = usePathname();
  const { role } = useAuth();
  const [hovered, setHovered] = useState(false);

  const isAdmin = role !== "user"; // admins (and unknown role during dev) see SYSTEM
  // Collapsed icon-rail by default on desktop; expands on hover. Mobile drawer is always expanded.
  const expanded = mobileOpen || hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-col border-r border-cloud bg-paper transition-[width,transform] duration-200 lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${
        expanded
          ? "lg:w-[240px] lg:shadow-[rgba(26,26,26,0.10)_0px_10px_30px]"
          : "lg:w-[72px]"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex h-[56px] items-center border-b border-cloud lg:h-14 ${
          expanded ? "gap-2 px-4" : "justify-center px-2"
        }`}
      >
        <img
          src="/brand/logo.svg"
          alt="DocuCheck Africa"
          width={expanded ? 30 : 26}
          height={expanded ? 20 : 16}
          className="shrink-0"
        />
        {expanded && (
          <span className="whitespace-nowrap font-display text-[17px] font-bold tracking-tight text-ink">
            DocuCheck Africa
          </span>
        )}
        {/* Mobile close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-sm text-graphite transition-colors hover:bg-mist hover:text-ink lg:hidden"
        >
          <Cancel01Icon size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.filter((g) => !g.adminOnly || isAdmin).map((group) => (
          <div key={group.label} className="mb-5">
            {expanded && <p className="micro-label whitespace-nowrap px-3 pb-2">{group.label}</p>}
            <ul className="flex flex-col gap-1">
              {group.items.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      title={!expanded ? label : undefined}
                      className={`flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-colors ${
                        active ? "bg-ink text-paper" : "text-ink hover:bg-mist"
                      } ${expanded ? "px-3" : "justify-center px-0"}`}
                    >
                      <Icon size={20} className="shrink-0" />
                      {expanded && <span className="truncate whitespace-nowrap">{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

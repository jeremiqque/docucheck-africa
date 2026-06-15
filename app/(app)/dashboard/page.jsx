"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { Add01Icon, CheckmarkCircle02Icon, Alert02Icon, CancelCircleIcon, Time02Icon } from "@/app/_components/icons";
import { PHASES, titleCase, relativeTime, ProjectCard, EmptyState } from "@/app/_components/project-ui";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState({}); // projectId -> { documents, checklist }
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load projects");
        const projs = data.projects ?? [];

        const entries = await Promise.all(
          projs.map(async (p) => {
            try {
              const r = await fetch(`/api/reports?projectId=${p.id}`);
              const d = await r.json();
              return [p.id, r.ok ? d.report : { documents: [], checklist: [] }];
            } catch {
              return [p.id, { documents: [], checklist: [] }];
            }
          })
        );

        let unread = 0;
        try {
          const { count } = await supabase
            .from("alerts")
            .select("*", { count: "exact", head: true })
            .eq("is_read", false);
          unread = count ?? 0;
        } catch {
          /* alerts table optional during dev */
        }

        if (!active) return;
        setProjects(projs);
        setReports(Object.fromEntries(entries));
        setAlertCount(unread);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const docsOf = (id) => reports[id]?.documents ?? [];
  const checklistOf = (id) => reports[id]?.checklist ?? [];
  const allDocs = projects.flatMap((p) => docsOf(p.id));

  const verifiedCount = allDocs.length;
  const passed = allDocs.filter((d) => d.verdict === "pass").length;
  const warnings = allDocs.filter((d) => d.verdict === "warning").length;
  const failed = allDocs.filter((d) => d.verdict === "fail").length;
  const cleared = projects.filter((p) => ["active", "complete"].includes(p.status)).length;

  const statusBreakdown = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const recent = [...allDocs]
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
    .slice(0, 7);
  const projectName = (id) => projects.find((p) => p.id === id)?.name ?? "Unknown project";

  return (
    <div className="px-4 py-6 lg:px-6">
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate">Compliance overview across all your projects</p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-black"
        >
          <Add01Icon size={18} />
          Upload document
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">{error}</div>
      )}

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          accent="gold"
          label="Total Projects"
          value={projects.length}
          sub={
            projects.length
              ? Object.entries(statusBreakdown)
                  .map(([k, v]) => `${v} ${PHASES[k]?.toLowerCase() ?? k}`)
                  .join(" · ")
              : "No projects yet"
          }
          loading={loading}
        />
        <StatCard
          accent="pass"
          label="Documents Verified"
          value={verifiedCount}
          sub={`${passed} passed · ${warnings} warnings · ${failed} failed`}
          loading={loading}
        />
        <StatCard
          accent="pass"
          label="Cleared Projects"
          value={cleared}
          sub="Active or completed clearance"
          loading={loading}
        />
        <StatCard
          accent="fail"
          label="Active Alerts"
          value={alertCount}
          sub={alertCount ? "Require attention" : "All clear"}
          loading={loading}
        />
      </div>

      {/* Projects + activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">My Projects</h2>
            <Link href="/projects" className="text-sm font-medium text-ink hover:opacity-70">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[150px] animate-pulse rounded-md border border-cloud bg-mist" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              body="Create your first project to start verifying compliance documents."
              ctaHref="/projects/new"
              ctaLabel="Create a project"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} docs={docsOf(p.id)} checklist={checklistOf(p.id)} />
              ))}
            </div>
          )}
        </section>

        {/* Recent activity rail */}
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Recent Activity</h2>
          <div className="overflow-hidden rounded-md border border-cloud bg-paper">
            {loading ? (
              <div className="space-y-px">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[58px] animate-pulse bg-mist" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate">No activity yet.</p>
            ) : (
              recent.map((d) => (
                <ActivityItem
                  key={d.id}
                  verdict={d.verdict}
                  title={`${titleCase(d.document_type || "Document")} — ${(d.verdict || "pending").toUpperCase()}`}
                  sub={projectName(d.project_id)}
                  time={relativeTime(d.uploaded_at)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Dashboard-only sub-components ── */

const ACCENT = { gold: "bg-gold", pass: "bg-pass", warn: "bg-warn", fail: "bg-fail" };

function StatCard({ accent, label, value, sub, loading }) {
  return (
    <div className="relative overflow-hidden rounded-md border border-cloud bg-paper p-5">
      <span className={`absolute inset-x-0 top-0 h-[3px] ${ACCENT[accent] ?? "bg-gold"}`} />
      <p className="micro-label">{label}</p>
      <p className="mt-2 font-display text-[28px] font-bold leading-none text-ink">{loading ? "—" : value}</p>
      <p className="mt-2 text-xs text-slate">{sub}</p>
    </div>
  );
}

const ACTIVITY_ICON = {
  pass: { Icon: CheckmarkCircle02Icon, color: "text-pass", bg: "bg-pass-wash" },
  warning: { Icon: Alert02Icon, color: "text-warn", bg: "bg-warn-wash" },
  fail: { Icon: CancelCircleIcon, color: "text-fail", bg: "bg-fail-wash" },
  pending: { Icon: Time02Icon, color: "text-slate", bg: "bg-cloud" },
};

function ActivityItem({ verdict, title, sub, time }) {
  const a = ACTIVITY_ICON[verdict] ?? ACTIVITY_ICON.pending;
  const Icon = a.Icon;
  return (
    <div className="flex items-center gap-3 border-b border-cloud px-4 py-3 last:border-b-0">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-sm ${a.bg} ${a.color}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">{title}</p>
        <p className="truncate text-xs text-slate">{sub}</p>
      </div>
      <span className="shrink-0 text-xs text-slate">{time}</span>
    </div>
  );
}

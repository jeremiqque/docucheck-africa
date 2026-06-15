"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JURISDICTIONS, titleCase, EmptyState } from "@/app/_components/project-ui";
import Select from "@/app/_components/Select";
import { DocumentValidationIcon } from "@/app/_components/icons";

export default function ReportsPage() {
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState("");

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");

  const [narrative, setNarrative] = useState("");
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (!active) return;
        const projs = res.ok ? data.projects ?? [] : [];
        setProjects(projs);
        if (projs.length) setProjectId(projs[0].id);
      } catch {
        /* ignore */
      } finally {
        if (active) setProjectsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    setReportLoading(true);
    setNarrative("");
    setError("");
    (async () => {
      try {
        const res = await fetch(`/api/reports?projectId=${projectId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load report");
        if (active) setReport(data.report);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setReportLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  async function generateNarrative() {
    setGenLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate narrative");
      setNarrative(data.narrative || "No narrative returned.");
    } catch (e) {
      setError(e.message);
    } finally {
      setGenLoading(false);
    }
  }

  const s = report?.summary ?? {};
  const project = report?.project;
  const STATS = [
    { label: "Total documents", value: s.total_documents ?? 0, accent: "bg-gold" },
    { label: "Passed", value: s.passed ?? 0, accent: "bg-pass" },
    { label: "Warnings", value: s.warnings ?? 0, accent: "bg-warn" },
    { label: "Failed", value: s.failed ?? 0, accent: "bg-fail" },
  ];

  if (!projectsLoading && projects.length === 0) {
    return (
      <div className="px-4 py-6 lg:px-6">
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Reports</h1>
          <p className="mt-1 text-sm text-slate">Compliance summary and audit narrative per project</p>
        </div>
        <EmptyState
          title="No projects to report on"
          body="Create a project and verify its documents — then generate compliance reports and AI narratives here."
          ctaHref="/projects/new"
          ctaLabel="Create a project"
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Reports</h1>
          <p className="mt-1 text-sm text-slate">Compliance summary and audit narrative per project</p>
        </div>
        <Select
          label="Project"
          value={projectId}
          onChange={setProjectId}
          disabled={projectsLoading}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
          className="min-w-[220px]"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">{error}</div>
      )}

      {reportLoading ? (
        <div className="h-64 animate-pulse rounded-md border border-cloud bg-mist" />
      ) : report ? (
        <>
          {/* Project banner */}
          <div className="mb-6 rounded-md border border-cloud bg-paper p-5">
            <p className="font-display text-lg font-semibold text-ink">{project.name}</p>
            <p className="mt-0.5 text-xs text-slate">
              {JURISDICTIONS[project.jurisdiction] ?? titleCase(project.jurisdiction)} ·{" "}
              {titleCase(project.project_type)} · {s.verified ?? 0} verified · {s.pending ?? 0} pending
            </p>
          </div>

          {/* Summary stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((st) => (
              <div key={st.label} className="relative overflow-hidden rounded-md border border-cloud bg-paper p-5">
                <span className={`absolute inset-x-0 top-0 h-[3px] ${st.accent}`} />
                <p className="micro-label">{st.label}</p>
                <p className="mt-2 font-display text-[26px] font-bold leading-none text-ink">{st.value}</p>
              </div>
            ))}
          </div>

          {/* AI narrative */}
          <div className="rounded-md border border-cloud bg-paper p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <DocumentValidationIcon size={20} className="text-ink" />
                <p className="font-display text-base font-semibold text-ink">AI compliance narrative</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generateNarrative}
                  disabled={genLoading}
                  className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-black disabled:opacity-60"
                >
                  {genLoading ? "Generating…" : narrative ? "Regenerate" : "Generate narrative"}
                </button>
                {narrative && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-md border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-mist"
                  >
                    Print / Save PDF
                  </button>
                )}
              </div>
            </div>
            {narrative ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-graphite">{narrative}</p>
            ) : (
              <p className="mt-4 text-sm text-slate">
                Generate an AI-written compliance summary for this project based on its verified documents.
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

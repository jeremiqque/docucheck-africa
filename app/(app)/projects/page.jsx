"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Add01Icon } from "@/app/_components/icons";
import { ProjectCard, EmptyState } from "@/app/_components/project-ui";

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState({}); // projectId -> { documents, checklist }

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

        if (!active) return;
        setProjects(projs);
        setReports(Object.fromEntries(entries));
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

  return (
    <div className="px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Projects</h1>
          <p className="mt-1 text-sm text-slate">
            {loading
              ? "Loading projects…"
              : `${projects.length} ${projects.length === 1 ? "project" : "projects"} total`}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-black"
        >
          <Add01Icon size={18} />
          New project
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[150px] animate-pulse rounded-md border border-cloud bg-mist" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Create your first project to generate its compliance checklist and start verifying documents."
          ctaHref="/projects/new"
          ctaLabel="Create a project"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              docs={reports[p.id]?.documents ?? []}
              checklist={reports[p.id]?.checklist ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

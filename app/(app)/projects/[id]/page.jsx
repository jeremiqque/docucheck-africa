"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import Link from "next/link";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { VerdictBadge, JURISDICTIONS, titleCase, relativeTime } from "@/app/_components/project-ui";
import {
  CheckmarkCircle02Icon,
  Alert02Icon,
  CancelCircleIcon,
  Time02Icon,
  Add01Icon,
  CloudUploadIcon,
  Delete02Icon,
  ArrowLeft01Icon,
  DocumentValidationIcon,
} from "@/app/_components/icons";

const TABS = [
  { key: "pre", label: "Pre-Construction" },
  { key: "post", label: "Post-Construction" },
  { key: "audit", label: "Audit Trail" },
];

// Resolve a checklist item (optionally joined to its document) to a verdict
function itemVerdict(item, doc) {
  if (doc?.verdict) return doc.verdict;
  if (item.status === "verified") return "pass";
  if (item.status === "failed") return "fail";
  return "pending";
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [audit, setAudit] = useState([]);
  const [tab, setTab] = useState("pre");
  const [refreshKey, setRefreshKey] = useState(0);

  const [narrative, setNarrative] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/reports?projectId=${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load project");
        if (!active) return;
        setReport(data.report);

        try {
          const { data: logs } = await supabase
            .from("audit_logs")
            .select("*")
            .eq("project_id", id)
            .order("created_at", { ascending: false });
          if (active) setAudit(logs ?? []);
        } catch {
          /* audit logs optional */
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, refreshKey]);

  async function handleDeleteDoc(docId) {
    if (!window.confirm("Delete this uploaded document? This cannot be undone.")) return;
    try {
      const res = await apiFetch(`/api/documents?id=${docId}`, { method: "DELETE" });
      if (res.ok) setRefreshKey((k) => k + 1);
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Could not delete the document.");
      }
    } catch {
      alert("Network error while deleting.");
    }
  }

  async function generateReport() {
    setGenError("");
    setGenLoading(true);
    try {
      const res = await apiFetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate report");
      setNarrative(data.narrative || "No narrative returned.");
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 lg:px-6">
        <div className="h-28 animate-pulse rounded-md border border-cloud bg-mist" />
        <div className="mt-5 h-64 animate-pulse rounded-md border border-cloud bg-mist" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-display text-xl font-bold text-ink">Project not found</p>
        <p className="mt-1 text-sm text-slate">{error || "This project could not be loaded."}</p>
        <Link href="/projects" className="mt-4 inline-block text-sm font-medium text-ink hover:opacity-70">
          ← Back to projects
        </Link>
      </div>
    );
  }

  const { project, documents = [], checklist = [], summary = {} } = report;
  const docsById = Object.fromEntries(documents.map((d) => [d.id, d]));

  const preItems = checklist.filter((c) => c.phase === "pre_construction");
  const postItems = checklist.filter((c) => c.phase === "post_construction");
  const verifiedOf = (items) => items.filter((c) => c.status === "verified").length;

  const overall =
    summary.failed > 0 ? "fail" : summary.warnings > 0 ? "warning" : documents.length > 0 ? "pass" : "pending";

  const counts = { pre: `${verifiedOf(preItems)}/${preItems.length}`, post: `${verifiedOf(postItems)}/${postItems.length}` };
  const jurisdictionLabel = JURISDICTIONS[project.jurisdiction] ?? titleCase(project.jurisdiction);

  return (
    <div className="px-4 py-6 lg:px-6">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate transition-colors hover:text-ink"
      >
        <ArrowLeft01Icon size={18} />
        Back to projects
      </Link>

      {/* Header */}
      <div className="rounded-md border border-cloud bg-paper p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">{project.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip>{jurisdictionLabel}</Chip>
              <Chip>{titleCase(project.project_type)}</Chip>
              <VerdictBadge verdict={overall} />
            </div>
            {project.description && (
              <p className="mt-3 max-w-xl text-sm text-slate">{project.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generateReport}
              disabled={genLoading}
              className="inline-flex items-center gap-2 rounded-md border border-ink px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-mist disabled:opacity-60"
            >
              <DocumentValidationIcon size={18} />
              {genLoading ? "Generating…" : "Generate report"}
            </button>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-black"
            >
              <Add01Icon size={18} />
              Upload
            </Link>
          </div>
        </div>
      </div>

      {/* AI narrative */}
      {genError && (
        <div className="mt-4 rounded-md border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">{genError}</div>
      )}
      {narrative && (
        <div className="mt-4 rounded-md border border-cloud bg-mist p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="micro-label">AI compliance summary</p>
            <button
              type="button"
              onClick={() => setNarrative("")}
              className="text-xs font-medium text-slate hover:text-ink"
            >
              Dismiss
            </button>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-graphite">{narrative}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-md bg-mist p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 whitespace-nowrap rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-paper text-ink shadow-[rgba(26,26,26,0.06)_0px_1px_2px]" : "text-slate hover:text-ink"
            }`}
          >
            {t.label}
            {t.key !== "audit" && <span className="ml-1.5 text-xs text-slate">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {tab === "pre" && (
          <ChecklistGroup
            title={`Pre-Construction Checklist (${jurisdictionLabel})`}
            items={preItems}
            docsById={docsById}
            onDelete={handleDeleteDoc}
          />
        )}
        {tab === "post" && (
          <ChecklistGroup
            title={`Post-Construction Checklist (${jurisdictionLabel})`}
            items={postItems}
            docsById={docsById}
            onDelete={handleDeleteDoc}
          />
        )}
        {tab === "audit" && <AuditTrail logs={audit} />}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-sm bg-mist px-2.5 py-1 text-xs font-medium text-graphite">
      {children}
    </span>
  );
}

const CIRCLE = {
  pass: { cls: "bg-pass border-pass text-paper", Icon: CheckmarkCircle02Icon },
  warning: { cls: "bg-warn border-warn text-paper", Icon: Alert02Icon },
  fail: { cls: "bg-fail border-fail text-paper", Icon: CancelCircleIcon },
  pending: { cls: "bg-transparent border-cloud text-slate", Icon: null },
};

function StatusCircle({ verdict }) {
  const c = CIRCLE[verdict] ?? CIRCLE.pending;
  const Icon = c.Icon;
  return (
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-pill border-2 ${c.cls}`}>
      {Icon && <Icon size={14} />}
    </span>
  );
}

function ChecklistGroup({ title, items, docsById, onDelete }) {
  if (!items.length) {
    return (
      <div className="rounded-md border border-cloud bg-paper px-6 py-10 text-center text-sm text-slate">
        No checklist items for this phase.
      </div>
    );
  }

  const verified = items.filter((c) => c.status === "verified").length;
  const anyFailed = items.some((c) => c.status === "failed");
  const allVerified = verified === items.length;

  return (
    <div>
      <div className="overflow-hidden rounded-md border border-cloud bg-paper">
        <div className="flex items-center justify-between bg-ink px-5 py-3.5">
          <p className="font-display text-[13px] font-semibold text-paper">{title}</p>
          <p className="text-xs text-paper/60">
            {verified} of {items.length} documents verified
          </p>
        </div>
        {items.map((item) => {
          const doc = item.document_id ? docsById[item.document_id] : null;
          const verdict = itemVerdict(item, doc);
          const sub = doc
            ? `${doc.issuing_authority || titleCase(doc.document_type || "")} · ${
                doc.uploaded_at ? "Verified " + relativeTime(doc.uploaded_at) : item.status
              }`
            : "Not yet uploaded";
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 border-b border-cloud px-5 py-3.5 last:border-b-0"
            >
              <StatusCircle verdict={verdict} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{titleCase(item.document_type)}</p>
                <p className="truncate text-xs text-slate">{sub}</p>
              </div>
              <VerdictBadge verdict={verdict} />
              <Link
                href={`/upload?project=${item.project_id}&phase=${item.phase}&type=${item.document_type}`}
                title={doc ? "Re-upload document" : "Upload this document"}
                aria-label="Upload this document"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-cloud text-ink transition-colors hover:border-ink hover:bg-mist"
              >
                <CloudUploadIcon size={18} />
              </Link>
              {doc && (
                <button
                  type="button"
                  onClick={() => onDelete(doc.id)}
                  title="Delete document"
                  aria-label="Delete document"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-cloud text-fail transition-colors hover:border-fail hover:bg-fail-wash"
                >
                  <Delete02Icon size={18} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {anyFailed && (
        <div className="mt-4 rounded-md border border-fail bg-fail-wash px-4 py-3">
          <p className="text-sm font-medium text-fail">Project cannot be cleared</p>
          <p className="mt-0.5 text-xs text-graphite">
            Resolve the failed documents and upload any missing items to unlock clearance.
          </p>
        </div>
      )}
      {!anyFailed && allVerified && (
        <div className="mt-4 rounded-md border border-pass bg-pass-wash px-4 py-3">
          <p className="text-sm font-medium text-pass">All documents verified for this phase</p>
        </div>
      )}
    </div>
  );
}

function AuditTrail({ logs }) {
  if (!logs.length) {
    return (
      <div className="rounded-md border border-cloud bg-paper px-6 py-10 text-center text-sm text-slate">
        No audit activity yet.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-cloud bg-paper">
      {logs.map((log) => {
        const action = (log.action || "").toUpperCase();
        const verdict = action.includes("FAIL")
          ? "fail"
          : action.includes("WARN")
          ? "warning"
          : action.includes("PASS")
          ? "pass"
          : "pending";
        const c = CIRCLE[verdict] ?? CIRCLE.pending;
        const Icon = c.Icon ?? Time02Icon;
        const tone =
          verdict === "fail"
            ? "text-fail bg-fail-wash"
            : verdict === "warning"
            ? "text-warn bg-warn-wash"
            : verdict === "pass"
            ? "text-pass bg-pass-wash"
            : "text-slate bg-cloud";
        return (
          <div key={log.id} className="flex items-center gap-3 border-b border-cloud px-5 py-3.5 last:border-b-0">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-sm ${tone}`}>
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink">{log.action}</p>
              {log.performed_by && <p className="truncate text-xs text-slate">{log.performed_by}</p>}
            </div>
            <span className="shrink-0 text-xs text-slate">{relativeTime(log.created_at)}</span>
          </div>
        );
      })}
    </div>
  );
}

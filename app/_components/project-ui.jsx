import Link from "next/link";
import { Add01Icon, CloudUploadIcon } from "./icons";

/* ── Shared lookups & helpers (used by Dashboard + Projects) ── */

export const JURISDICTIONS = {
  nigeria: "Nigeria",
  ghana: "Ghana",
  south_africa: "South Africa",
};

export const PHASES = {
  pre_compliance: "Pre-compliance",
  active: "Active",
  post_compliance: "Post-compliance",
  complete: "Complete",
};

export function titleCase(s = "") {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

// Worst verdict wins: fail > warning > pass; none → pending
export function projectVerdict(docs) {
  if (!docs.length) return "pending";
  if (docs.some((d) => d.verdict === "fail")) return "fail";
  if (docs.some((d) => d.verdict === "warning")) return "warning";
  if (docs.every((d) => d.verdict === "pass")) return "pass";
  return "pending";
}

/* ── Verdict badge ── */

const BADGE = {
  pass: { wrap: "bg-pass-wash text-pass", label: "Pass" },
  warning: { wrap: "bg-warn-wash text-warn", label: "Warning" },
  fail: { wrap: "bg-fail-wash text-fail", label: "Failed" },
  pending: { wrap: "bg-cloud text-slate", label: "Pending" },
};

export function VerdictBadge({ verdict }) {
  const b = BADGE[verdict] ?? BADGE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium ${b.wrap}`}>
      <span className="h-1.5 w-1.5 rounded-pill bg-current" />
      {b.label}
    </span>
  );
}

/* ── Project card ── */
/* Progress is checklist-based (verified / total). Verdict comes from documents. */

const FILL = { pass: "bg-pass", warning: "bg-warn", fail: "bg-fail", pending: "bg-slate" };

export function ProjectCard({ project, docs = [], checklist = [] }) {
  const verdict = projectVerdict(docs);
  const total = checklist.length;
  const verified = checklist.filter((c) => c.status === "verified").length;
  const pending = checklist.filter((c) => c.status === "pending").length;
  const pct = total ? Math.round((verified / total) * 100) : 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-md border border-cloud bg-paper p-5 transition-all hover:-translate-y-0.5 hover:border-ink"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-ink">{project.name}</p>
          <p className="mt-0.5 text-xs text-slate">
            {JURISDICTIONS[project.jurisdiction] ?? titleCase(project.jurisdiction)} ·{" "}
            {titleCase(project.project_type)}
          </p>
        </div>
        <VerdictBadge verdict={verdict} />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate">
          <span>{PHASES[project.status] ?? titleCase(project.status)}</span>
          <span>
            {verified}/{total || 0}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-pill bg-cloud">
          <div className={`h-full rounded-pill ${FILL[verdict]}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate">
          <span>
            <strong className="font-semibold text-ink">{verified}</strong> verified
          </span>
          <span>
            <strong className="font-semibold text-ink">{pending}</strong> pending
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Empty state ── */

export function EmptyState({ title, body, ctaHref, ctaLabel }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-cloud bg-mist px-8 py-14 text-center">
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-pill bg-cloud text-graphite">
        <CloudUploadIcon size={22} />
      </span>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate">{body}</p>
      {ctaHref && (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-black"
        >
          <Add01Icon size={18} />
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

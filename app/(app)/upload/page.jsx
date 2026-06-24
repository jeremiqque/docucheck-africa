"use client";

import { useEffect, useRef, useState } from "react";
import BrandLoader from "@/app/_components/BrandLoader";
import { apiFetch } from "@/lib/apiFetch";
import Link from "next/link";
import { useAuth } from "@/app/_components/useAuth";
import Select from "@/app/_components/Select";
import { titleCase } from "@/app/_components/project-ui";
import {
  CloudUploadIcon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  CancelCircleIcon,
  Time02Icon,
} from "@/app/_components/icons";

const STEPS = [
  "Uploading file",
  "Validating file type & size",
  "Storing securely (AWS S3)",
  "Extracting text (OCR)",
  "Classifying document type",
  "Extracting data fields",
  "Running compliance rule engine",
  "Detecting anomalies",
  "Saving results",
];

const ALLOWED = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_BYTES = 10 * 1024 * 1024;

const VERDICT = {
  pass: { wrap: "bg-pass-wash border-pass", text: "text-pass", Icon: CheckmarkCircle02Icon, label: "PASS" },
  warning: { wrap: "bg-warn-wash border-warn", text: "text-warn", Icon: Alert02Icon, label: "WARNING" },
  fail: { wrap: "bg-fail-wash border-fail", text: "text-fail", Icon: CancelCircleIcon, label: "FAIL" },
};

const CHECK_COLOR = { pass: "text-pass", warning: "text-warn", fail: "text-fail" };

function fmtField(v) {
  return v === null || v === undefined || v === "" ? "-" : String(v);
}

export default function UploadPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const intervalRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState("");
  const [phase, setPhase] = useState("pre_construction");

  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch("/api/projects");
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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const selectedProject = projects.find((p) => p.id === projectId);

  function validate(file) {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) return `Unsupported file type. Allowed: ${ALLOWED.join(", ")}`;
    if (file.size > MAX_BYTES) return "File is larger than 10MB.";
    return "";
  }

  function startStepAnimation() {
    setActiveStep(0);
    intervalRef.current = setInterval(() => {
      // Advance optimistically but hold before the final step until the API responds.
      setActiveStep((s) => (s < STEPS.length - 2 ? s + 1 : s));
    }, 650);
  }

  async function processFile(file) {
    setError("");
    if (!projectId) {
      setError("Please select a project first.");
      return;
    }
    const v = validate(file);
    if (v) {
      setError(v);
      return;
    }

    setFileName(file.name);
    setResult(null);
    setStatus("processing");
    startStepAnimation();

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("project_id", projectId);
      fd.append("jurisdiction", selectedProject?.jurisdiction ?? "");
      fd.append("phase", phase);
      if (user?.email) fd.append("user_email", user.email);

      const res = await apiFetch("/api/documents", { method: "POST", body: fd });
      const data = await res.json();

      if (intervalRef.current) clearInterval(intervalRef.current);

      if (!res.ok) {
        setActiveStep(-1);
        setStatus("error");
        setError(data.error || "Document processing failed.");
        return;
      }

      setActiveStep(STEPS.length); // all done
      setResult(data);
      setTimeout(() => setStatus("done"), 500);
    } catch {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setActiveStep(-1);
      setStatus("error");
      setError("Network error while processing the document.");
    }
  }

  function reset() {
    setStatus("idle");
    setActiveStep(-1);
    setResult(null);
    setError("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const noProjects = !projectsLoading && projects.length === 0;

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mb-8">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Compliance check</h1>
        <p className="mt-1 text-sm text-slate">
          Upload a compliance document to run it through the 9-step verification pipeline.
        </p>
      </div>

      {noProjects ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-cloud bg-mist px-8 py-14 text-center">
          <span className="mb-3 grid h-11 w-11 place-items-center rounded-pill bg-cloud text-graphite">
            <CloudUploadIcon size={22} />
          </span>
          <p className="font-display text-lg font-semibold text-ink">Create a project first</p>
          <p className="mt-1 max-w-sm text-sm text-slate">
            Documents are attached to a project, which sets the jurisdiction and checklist.
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-black"
          >
            Create a project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left: drop zone / processing / result */}
          <div className="flex flex-col gap-5">
            {status === "idle" && (
              <DropZone
                fileInputRef={fileInputRef}
                onFile={processFile}
                disabled={!projectId}
              />
            )}

            {status === "processing" && (
              <ProcessingCard steps={STEPS} activeStep={activeStep} fileName={fileName} />
            )}

            {status === "error" && (
              <div className="rounded-md border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">
                {error}
                <button
                  type="button"
                  onClick={reset}
                  className="ml-3 font-medium underline hover:opacity-80"
                >
                  Try again
                </button>
              </div>
            )}

            {status === "done" && result && (
              <ResultCard result={result} projectId={projectId} onReset={reset} />
            )}

            {status === "idle" && error && (
              <div className="rounded-md border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">
                {error}
              </div>
            )}
          </div>

          {/* Right: document details + info */}
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-cloud bg-paper p-5">
              <p className="micro-label mb-4">Document details</p>

              <Select
                label="Project"
                value={projectId}
                onChange={setProjectId}
                disabled={status === "processing"}
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
                className="mb-4"
              />

              <Select
                label="Compliance phase"
                value={phase}
                onChange={setPhase}
                disabled={status === "processing"}
                options={[
                  { value: "pre_construction", label: "Pre-Construction" },
                  { value: "post_construction", label: "Post-Construction" },
                ]}
                className="mb-4"
              />

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-graphite">Jurisdiction</span>
                <p className="rounded-sm border border-cloud bg-mist px-3 py-2.5 text-sm capitalize text-slate">
                  {selectedProject ? selectedProject.jurisdiction.replace(/_/g, " ") : "-"}
                  <span className="ml-1 text-xs">(from project)</span>
                </p>
              </div>
            </div>

            <div className="rounded-md border border-cloud bg-mist p-4">
              <p className="text-[13px] font-medium text-ink">How it works</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate">
                Your document is processed through a 9-step AI pipeline (AWS Textract for OCR and
                GPT for classification and field extraction), then checked against the compliance
                rules for the project&apos;s jurisdiction. Results appear in under 30 seconds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Drop zone ── */
function DropZone({ fileInputRef, onFile, disabled }) {
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-8 py-16 text-center transition-colors ${
        dragOver ? "border-ink bg-mist" : "border-cloud bg-paper hover:bg-mist"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-pill bg-mist text-ink">
        <CloudUploadIcon size={24} />
      </span>
      <p className="font-display text-lg font-semibold text-ink">
        Drop your compliance document here
      </p>
      <p className="mt-1 text-sm text-slate">or click to browse from your computer</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {["PDF", "JPEG", "PNG"].map((t) => (
          <span
            key={t}
            className="rounded-pill border border-cloud bg-mist px-2.5 py-1 text-xs font-medium text-slate"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Processing card (9-step) ── */
function ProcessingCard({ steps, activeStep, fileName }) {
  return (
    <div className="rounded-lg border border-cloud bg-paper p-6">
      <div className="mb-5 flex items-center gap-3">
        <BrandLoader size={16} />
        <p className="font-display text-[15px] font-semibold text-ink">
          Processing {fileName || "document"}…
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {steps.map((label, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                done ? "bg-pass-wash" : active ? "bg-mist" : "opacity-50"
              }`}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center">
                {done ? (
                  <CheckmarkCircle02Icon size={18} className="text-pass" />
                ) : active ? (
                  <BrandLoader size={16} />
                ) : (
                  <Time02Icon size={16} className="text-slate" />
                )}
              </span>
              <span className={done || active ? "text-ink" : "text-slate"}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Result card ── */
function ResultCard({ result, projectId, onReset }) {
  const verdict = result?.compliance?.verdict ?? "pending";
  const cfg = VERDICT[verdict] ?? VERDICT.fail;
  const Icon = cfg.Icon;
  const fields = result?.fields ?? {};
  const checks = result?.compliance?.checks ?? [];
  const anomalies = Array.isArray(result?.anomalies) ? result.anomalies : [];
  const docType = titleCase(result?.classification?.document_type || fields.document_type || "Document");

  const FIELD_ROWS = [
    ["Document type", titleCase(fields.document_type || "")],
    ["Issuing authority", fmtField(fields.issuing_authority)],
    ["Issue date", fmtField(fields.issue_date)],
    ["Expiry date", fmtField(fields.expiry_date)],
    ["Holder name", fmtField(fields.holder_name)],
    ["Jurisdiction", fmtField(fields.jurisdiction)],
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-cloud bg-paper">
      {/* Header */}
      <div className={`flex items-center gap-4 border-b px-6 py-5 ${cfg.wrap}`}>
        <Icon size={32} className={cfg.text} />
        <div>
          <p className={`font-display text-[22px] font-bold ${cfg.text}`}>{cfg.label}</p>
          <p className="text-sm text-graphite">{docType}</p>
        </div>
      </div>

      <div className="p-6">
        {result?.compliance?.summary && (
          <p className="mb-5 text-sm text-graphite">{result.compliance.summary}</p>
        )}

        {/* Extracted fields */}
        <p className="micro-label mb-3">Extracted fields</p>
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELD_ROWS.map(([label, value]) => (
            <div key={label} className="rounded-sm bg-mist p-3">
              <p className="micro-label">{label}</p>
              <p className="mt-1 text-sm font-medium text-ink">{value || "-"}</p>
            </div>
          ))}
        </div>

        {/* Compliance checks */}
        <p className="micro-label mb-3">Compliance checks</p>
        <ul className="flex flex-col gap-1.5">
          {checks.map((c, i) => (
            <CheckRow key={i} status={c.status} message={c.message} />
          ))}
          {anomalies.map((a, i) => (
            <CheckRow
              key={`a-${i}`}
              status="warning"
              message={typeof a === "string" ? a : a.message || "Anomaly detected"}
            />
          ))}
          {checks.length === 0 && anomalies.length === 0 && (
            <li className="text-sm text-slate">No checks returned.</li>
          )}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-black"
          >
            View in project
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-mist"
          >
            Upload another
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ status, message }) {
  const color = CHECK_COLOR[status] ?? "text-slate";
  const Icon =
    status === "pass" ? CheckmarkCircle02Icon : status === "fail" ? CancelCircleIcon : Alert02Icon;
  return (
    <li className="flex items-start gap-2.5 rounded-sm bg-mist px-3 py-2.5 text-sm text-graphite">
      <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} />
      <span>{message}</span>
    </li>
  );
}

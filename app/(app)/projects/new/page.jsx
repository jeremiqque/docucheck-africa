"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft01Icon } from "@/app/_components/icons";
import Select from "@/app/_components/Select";

const JURISDICTIONS = [
  ["nigeria", "Nigeria"],
  ["ghana", "Ghana"],
  ["south_africa", "South Africa"],
];

const PROJECT_TYPES = [
  ["residential", "Residential"],
  ["commercial", "Commercial"],
  ["industrial", "Industrial"],
  ["infrastructure", "Infrastructure"],
];

const fieldClass =
  "w-full rounded-sm border border-cloud bg-mist px-3.5 py-2.5 text-sm text-ink placeholder:text-slate outline-none transition-colors focus:border-ink focus:bg-paper";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    jurisdiction: "nigeria",
    project_type: "residential",
  });

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create the project. Please try again.");
        return;
      }
      router.push("/projects");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[640px] px-4 py-6 lg:px-6">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate transition-colors hover:text-ink"
      >
        <ArrowLeft01Icon size={18} />
        Back to projects
      </Link>

      <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">New project</h1>
      <p className="mt-1 text-sm text-slate">
        Creating a project automatically generates its pre- and post-construction compliance checklist.
      </p>

      {error && (
        <div className="mt-6 rounded-sm border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-5 rounded-lg border border-cloud bg-paper p-6 sm:p-8"
      >
        <Field label="Project name" required>
          <input
            type="text"
            required
            value={form.name}
            onChange={update("name")}
            placeholder="e.g. Lekki Housing Estate"
            className={fieldClass}
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={update("description")}
            placeholder="Optional: a short note about this project"
            className={`${fieldClass} resize-y`}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select
            label="Jurisdiction"
            required
            value={form.jurisdiction}
            onChange={(v) => setForm((f) => ({ ...f, jurisdiction: v }))}
            options={JURISDICTIONS.map(([value, label]) => ({ value, label }))}
          />

          <Select
            label="Project type"
            required
            value={form.project_type}
            onChange={(v) => setForm((f) => ({ ...f, project_type: v }))}
            options={PROJECT_TYPES.map(([value, label]) => ({ value, label }))}
          />
        </div>

        <div className="mt-1 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create project"}
          </button>
          <Link
            href="/projects"
            className="rounded-md border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-mist"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-graphite">
        {label}
        {required && <span className="text-slate"> *</span>}
      </span>
      {children}
    </label>
  );
}

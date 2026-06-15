"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { useAuth } from "@/app/_components/useAuth";
import { UserIcon, Cancel01Icon } from "@/app/_components/icons";
import Select from "@/app/_components/Select";

export default function AdminPage() {
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, projects: 0, documents: 0, alerts: 0 });
  const [showModal, setShowModal] = useState(false);

  const isAdmin = role === "admin";

  const load = useCallback(async () => {
    try {
      const [profiles, projCount, docCount, alertCount] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("alerts").select("*", { count: "exact", head: true }).eq("is_read", false),
      ]);
      if (profiles.error) throw profiles.error;
      const rows = profiles.data ?? [];
      setUsers(rows);
      setStats({
        users: rows.length,
        projects: projCount.count ?? 0,
        documents: docCount.count ?? 0,
        alerts: alertCount.count ?? 0,
      });
    } catch (e) {
      setError(e.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    load();
  }, [authLoading, isAdmin, load]);

  if (!authLoading && !isAdmin) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-display text-xl font-bold text-ink">Access restricted</p>
        <p className="mt-1 text-sm text-slate">The admin panel is only available to administrators.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-ink hover:opacity-70">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const admins = users.filter((u) => u.role === "admin").length;
  const regular = users.length - admins;

  const STAT = [
    { label: "Total Users", value: stats.users, accent: "gold", sub: `${admins} admin · ${regular} user` },
    { label: "Total Projects", value: stats.projects, accent: "pass", sub: "Across all jurisdictions" },
    { label: "Documents Processed", value: stats.documents, accent: "pass", sub: "Since system launch" },
    {
      label: "Active Alerts",
      value: stats.alerts,
      accent: "fail",
      sub: stats.alerts ? "Require attention" : "All clear",
    },
  ];

  return (
    <div className="px-4 py-6 lg:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Admin panel</h1>
        <p className="mt-1 text-sm text-slate">System overview and user management</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">{error}</div>
      )}

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT.map((s) => (
          <StatCard key={s.label} accent={s.accent} label={s.label} value={s.value} sub={s.sub} loading={loading} />
        ))}
      </div>

      {/* Users */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">User management</h2>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-black"
        >
          + Add user
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-cloud bg-paper">
        {loading ? (
          <div className="space-y-px">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[64px] animate-pulse bg-mist" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate">No users found.</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 border-b border-cloud px-5 py-3.5 last:border-b-0">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-mist text-graphite">
                <UserIcon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{u.full_name || "Unnamed user"}</p>
                <p className="truncate text-xs text-slate">{u.organisation || "—"}</p>
              </div>
              <span
                className={`rounded-pill px-2.5 py-1 text-xs font-medium ${
                  u.role === "admin" ? "bg-ink text-paper" : "bg-mist text-graphite"
                }`}
              >
                {u.role === "admin" ? "Administrator" : "User"}
              </span>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            setLoading(true);
            load();
          }}
        />
      )}
    </div>
  );
}

/* Stat card — matches the dashboard */
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

const fieldClass =
  "w-full rounded-sm border border-cloud bg-mist px-3.5 py-2.5 text-sm text-ink placeholder:text-slate outline-none transition-colors focus:border-ink focus:bg-paper";

function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    organisation: "",
    role: "user",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create the user.");
        return;
      }
      onCreated();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/30 px-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-lg border border-cloud bg-paper shadow-[rgba(26,26,26,0.12)_0px_8px_24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cloud px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">Add user</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-sm text-slate transition-colors hover:bg-mist hover:text-ink"
          >
            <Cancel01Icon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {error && (
            <div className="rounded-sm border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">{error}</div>
          )}

          <Field label="Full name" required>
            <input type="text" required value={form.full_name} onChange={update("full_name")} placeholder="Jane Doe" className={fieldClass} />
          </Field>
          <Field label="Email address" required>
            <input type="email" required value={form.email} onChange={update("email")} placeholder="jane@company.com" className={fieldClass} />
          </Field>
          <Field label="Temporary password" required>
            <input type="text" required value={form.password} onChange={update("password")} placeholder="At least 8 characters" className={fieldClass} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Organisation">
              <input type="text" value={form.organisation} onChange={update("organisation")} placeholder="Axiom Black" className={fieldClass} />
            </Field>
            <Select
              label="Role"
              required
              value={form.role}
              onChange={(v) => setForm((f) => ({ ...f, role: v }))}
              options={[
                { value: "user", label: "User" },
                { value: "admin", label: "Administrator" },
              ]}
            />
          </div>

          <div className="mt-1 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create user"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-ink px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-mist"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
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

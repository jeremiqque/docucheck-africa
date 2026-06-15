"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import { relativeTime } from "@/app/_components/project-ui";
import { CancelCircleIcon, Alert02Icon, Time02Icon, Notification01Icon } from "@/app/_components/icons";

const TYPE = {
  fail: { Icon: CancelCircleIcon, tone: "text-fail", wrap: "border-fail bg-fail-wash", label: "Compliance fail" },
  warning: { Icon: Alert02Icon, tone: "text-warn", wrap: "border-warn bg-warn-wash", label: "Warning" },
  expiry: { Icon: Time02Icon, tone: "text-warn", wrap: "border-warn bg-warn-wash", label: "Expiring soon" },
};

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [projectNames, setProjectNames] = useState({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ data: rows, error: aErr }, { data: projs }] = await Promise.all([
          supabase.from("alerts").select("*").order("created_at", { ascending: false }),
          supabase.from("projects").select("id, name"),
        ]);
        if (aErr) throw aErr;
        if (!active) return;
        setAlerts(rows ?? []);
        setProjectNames(Object.fromEntries((projs ?? []).map((p) => [p.id, p.name])));
      } catch (e) {
        if (active) setError(e.message || "Failed to load alerts");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function markRead(id) {
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
    await supabase.from("alerts").update({ is_read: true }).eq("id", id);
  }

  async function markAllRead() {
    setAlerts((a) => a.map((x) => ({ ...x, is_read: true })));
    await supabase.from("alerts").update({ is_read: true }).eq("is_read", false);
  }

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Alerts</h1>
          <p className="mt-1 text-sm text-slate">
            {loading ? "Loading alerts…" : unread ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-md border border-ink px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-mist"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-md border border-cloud bg-mist" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-cloud bg-mist px-8 py-16 text-center">
          <span className="mb-3 grid h-11 w-11 place-items-center rounded-pill bg-cloud text-graphite">
            <Notification01Icon size={22} />
          </span>
          <p className="font-display text-lg font-semibold text-ink">No alerts</p>
          <p className="mt-1 text-sm text-slate">Compliance warnings and failures will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((a) => {
            const t = TYPE[a.type] ?? TYPE.warning;
            const Icon = t.Icon;
            return (
              <div
                key={a.id}
                className={`rounded-md border px-5 py-4 transition-opacity ${t.wrap} ${a.is_read ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={22} className={`mt-0.5 shrink-0 ${t.tone}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-display text-sm font-bold ${t.tone}`}>{t.label}</p>
                      {!a.is_read && <span className="h-1.5 w-1.5 rounded-pill bg-current" />}
                      <span className="text-xs text-slate">{relativeTime(a.created_at)}</span>
                    </div>
                    {a.project_id && projectNames[a.project_id] && (
                      <p className="mt-0.5 text-xs text-graphite">{projectNames[a.project_id]}</p>
                    )}
                    <p className="mt-1.5 text-sm text-graphite">{a.message}</p>
                    <div className="mt-3 flex items-center gap-4">
                      {a.project_id && (
                        <Link
                          href={`/projects/${a.project_id}`}
                          className="text-xs font-medium text-ink underline-offset-2 hover:underline"
                        >
                          View project →
                        </Link>
                      )}
                      {!a.is_read && (
                        <button
                          type="button"
                          onClick={() => markRead(a.id)}
                          className="text-xs font-medium text-slate hover:text-ink"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

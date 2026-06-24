"use client";

import { useState, useEffect } from "react";
import BrandLoader from "@/app/_components/BrandLoader";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import {
  ArrowLeft01Icon,
  CustomerSupportIcon,
  ViewIcon,
  ViewOffIcon,
  CheckmarkCircle02Icon,
} from "../_components/icons";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState("checking"); // "checking" | "ready" | "invalid" | "done"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ password: "", confirm: "" });

  // The recovery link lands here. supabaseClient has detectSessionInUrl: true,
  // so the token in the URL is parsed into a session automatically.
  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setPhase("ready");
    });

    const hasToken =
      typeof window !== "undefined" &&
      (window.location.hash.includes("access_token") ||
        window.location.hash.includes("type=recovery") ||
        new URLSearchParams(window.location.search).has("code"));

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setPhase("ready");
      else if (!hasToken) setPhase("invalid");
      // else: token present but not parsed yet, the auth listener / timeout decides
    });

    // Fallback: if the token never resolves into a session, mark invalid.
    const t = setTimeout(() => {
      if (active) setPhase((p) => (p === "checking" ? "invalid" : p));
    }, 4000);

    return () => {
      active = false;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: form.password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPhase("done");
    await supabase.auth.signOut();
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-mist">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-paper/20" aria-hidden="true" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <a
          href="/login"
          className="flex items-center gap-2 text-sm font-medium text-ink transition-opacity hover:opacity-70"
        >
          <ArrowLeft01Icon size={18} />
          Back to login
        </a>

        <div className="flex items-center gap-2">
          <img src="/brand/logo.svg" alt="" width={30} height={20} />
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            DocuCheck Africa
          </span>
        </div>

        <a
          href="mailto:support@jeremiahalalade.me"
          className="flex items-center gap-2 text-sm font-medium text-ink transition-opacity hover:opacity-70"
        >
          <CustomerSupportIcon size={18} />
          <span className="hidden sm:inline">Contact support</span>
        </a>
      </header>

      <div className="relative z-10 flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px] rounded-lg border border-cloud bg-paper p-8 shadow-[rgba(26,26,26,0.12)_0px_8px_24px] sm:p-10">
          {phase === "checking" && (
            <div className="flex flex-col items-center py-6 text-center">
              <BrandLoader size={40} />
              <p className="mt-4 text-sm text-slate">Verifying your reset link…</p>
            </div>
          )}

          {phase === "invalid" && (
            <>
              <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink">
                Link expired
              </h1>
              <p className="mt-2 text-sm text-slate">
                This password reset link is invalid or has already been used. Request a new one
                from the login screen.
              </p>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-6 w-full rounded-md bg-ink py-3 text-sm font-medium text-paper transition-colors hover:bg-black"
              >
                Back to login
              </button>
            </>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center py-4 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-pill bg-pass-wash text-pass">
                <CheckmarkCircle02Icon size={26} />
              </span>
              <h1 className="mt-4 font-display text-[28px] font-bold leading-tight tracking-tight text-ink">
                Password updated
              </h1>
              <p className="mt-2 text-sm text-slate">
                Your password has been changed. Redirecting you to login…
              </p>
            </div>
          )}

          {phase === "ready" && (
            <>
              <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink">
                Set a new password
              </h1>
              <p className="mt-1 text-sm text-slate">
                Choose a strong password you have not used before.
              </p>

              {error && (
                <div className="mt-5 rounded-sm border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
                <Field label="New password">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate transition-colors hover:text-ink"
                    >
                      {showPassword ? <ViewOffIcon size={18} /> : <ViewIcon size={18} />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm new password">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.confirm}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, confirm: e.target.value }))
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full rounded-md bg-ink py-3 text-sm font-medium text-paper transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-sm border border-cloud bg-mist px-3.5 py-2.5 text-sm text-ink placeholder:text-slate outline-none transition-colors focus:border-ink focus:bg-paper";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-graphite">{label}</span>
      {children}
    </label>
  );
}

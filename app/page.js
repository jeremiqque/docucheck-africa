"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import {
  ArrowLeft01Icon,
  CustomerSupportIcon,
  ViewIcon,
  ViewOffIcon,
} from "./_components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    organisation: "",
    email: "",
    password: "",
  });

  const isRegister = mode === "register";

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const payload = isRegister
        ? {
            action: "register",
            email: form.email,
            password: form.password,
            full_name: form.fullName,
            organisation: form.organisation,
          }
        : { action: "login", email: form.email, password: form.password };

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (isRegister) {
        setNotice(
          data.message || "Registration successful — check your email to verify your account."
        );
        setMode("login");
        setForm((f) => ({ ...f, password: "" }));
      } else {
        // Persist the session in the browser so the app shell (useAuth) sees it.
        if (data.session?.access_token) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-mist">
      {/* Full-bleed background photo (graceful fallback to bg-mist if absent) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-paper/20" aria-hidden="true" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <a
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-ink transition-opacity hover:opacity-70"
        >
          <ArrowLeft01Icon size={18} />
          Back
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

      {/* Centered card */}
      <div className="relative z-10 flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px] rounded-lg border border-cloud bg-paper p-8 shadow-[rgba(26,26,26,0.12)_0px_8px_24px] sm:p-10">
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink">
            {isRegister ? "Create your account" : "Log in DocuCheck Africa"}
          </h1>
          <p className="mt-1 text-sm text-slate">
            {isRegister ? "Set up your compliance workspace" : "Sign in to your account"}
          </p>

          {notice && (
            <div className="mt-5 rounded-sm border border-pass bg-pass-wash px-4 py-3 text-sm text-pass">
              {notice}
            </div>
          )}
          {error && (
            <div className="mt-5 rounded-sm border border-fail bg-fail-wash px-4 py-3 text-sm text-fail">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            {isRegister && (
              <>
                <Field label="Full name">
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={update("fullName")}
                    placeholder="Alalade Jeremiah"
                    className={inputClass}
                  />
                </Field>
                <Field label="Organisation">
                  <input
                    type="text"
                    value={form.organisation}
                    onChange={update("organisation")}
                    placeholder="Axiom Black"
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            <Field label="Email address">
              <input
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                placeholder="you@company.com"
                autoComplete="email"
                className={inputClass}
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={update("password")}
                  placeholder="••••••••"
                  autoComplete={isRegister ? "new-password" : "current-password"}
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

            {!isRegister && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-graphite">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-sm border-cloud accent-ink"
                  />
                  Remember me
                </label>
                {/* Placeholder — password reset flow to be wired later */}
                <button
                  type="button"
                  className="font-medium text-ink transition-opacity hover:opacity-70"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-md bg-ink py-3 text-sm font-medium text-paper transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isRegister
                  ? "Creating account…"
                  : "Signing in…"
                : isRegister
                ? "Create account"
                : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate">
            {isRegister ? "Already have an account? " : "No account? "}
            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError("");
                setNotice("");
              }}
              className="font-medium text-ink transition-opacity hover:opacity-70"
            >
              {isRegister ? "Log in here" : "Sign up here"}
            </button>
          </p>
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import {
  ArrowLeft01Icon,
  CustomerSupportIcon,
  ViewIcon,
  ViewOffIcon,
} from "@/app/_components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    organisation: "",
    email: "",
    password: "",
  });

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleGoogle() {
    setError("");
    setOauthLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    // On success the browser redirects to Google, so nothing else runs here.
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (isForgot) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          form.email,
          { redirectTo: `${window.location.origin}/reset-password` }
        );
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setNotice(
          "If an account exists for that email, a password reset link is on its way. Check your inbox."
        );
        setMode("login");
        return;
      }

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
          data.message || "Registration successful. Check your email to verify your account."
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

  const title = isForgot
    ? "Reset your password"
    : isRegister
    ? "Create your account"
    : "Log in DocuCheck Africa";
  const subtitle = isForgot
    ? "Enter your email and we will send you a secure reset link"
    : isRegister
    ? "Set up your compliance workspace"
    : "Sign in to your account";

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-mist">
      {/* Full-bleed background photo (graceful fallback to bg-mist if absent) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.webp')" }}
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
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate">{subtitle}</p>

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

            {!isForgot && (
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
            )}

            {!isRegister && !isForgot && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-graphite">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-sm border-cloud accent-ink"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
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
                ? isForgot
                  ? "Sending…"
                  : isRegister
                  ? "Creating account…"
                  : "Signing in…"
                : isForgot
                ? "Send reset link"
                : isRegister
                ? "Create account"
                : "Sign in"}
            </button>
          </form>

          {!isForgot && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-cloud" />
                <span className="text-xs text-slate">or</span>
                <span className="h-px flex-1 bg-cloud" />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={oauthLoading}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-cloud bg-paper py-2.5 text-sm font-medium text-ink transition-colors hover:bg-mist disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleGlyph />
                {oauthLoading ? "Redirecting…" : "Continue with Google"}
              </button>
            </>
          )}

          {isForgot ? (
            <p className="mt-6 text-center text-sm text-slate">
              Remembered your password?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-medium text-ink transition-opacity hover:opacity-70"
              >
                Back to login
              </button>
            </p>
          ) : (
            <p className="mt-6 text-center text-sm text-slate">
              {isRegister ? "Already have an account? " : "No account? "}
              <button
                type="button"
                onClick={() => switchMode(isRegister ? "login" : "register")}
                className="font-medium text-ink transition-opacity hover:opacity-70"
              >
                {isRegister ? "Log in here" : "Sign up here"}
              </button>
            </p>
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

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

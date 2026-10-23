"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Eye, EyeOff, Mail, ShieldCheck, User } from "lucide-react";
import { Button, Field, Input } from "./ui";
import { useSession } from "./session-provider";

type Mode = "signin" | "signup";

function strengthOf(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^\w\s]/.test(pw)) score++;
  return Math.min(score, 5);
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"];
const COLORS = [
  "bg-alert-500",
  "bg-alert-400",
  "bg-gold-400",
  "bg-brand-400",
  "bg-mint-400",
  "bg-mint-300",
];

function AuthFormInner({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, signUp, user, loading: sessionLoading, durable } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get("next") || "/dashboard";
  const reason = params.get("reason");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  // Already signed in? Straight through to the app.
  useEffect(() => {
    if (!sessionLoading && user) router.replace(safeNext);
  }, [sessionLoading, user, router, safeNext]);

  const strength = useMemo(() => strengthOf(password), [password]);
  const isSignup = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (isSignup) {
      if (name.trim().length < 2) {
        setError("Please tell us what to call you.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    } else if (!password) {
      setError("Enter your password.");
      return;
    }

    setBusy(true);
    try {
      const res = isSignup
        ? await signUp(name.trim(), email.trim(), password)
        : await signIn(email.trim(), password);

      if (res.ok) {
        router.replace(safeNext);
        router.refresh();
      } else {
        setError(res.error || "Something went wrong.");
        setBusy(false);
      }
    } catch {
      setError("Unexpected error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-7">
        <h1 className="text-[1.7rem] font-bold tracking-tight text-white">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-[0.9rem] text-slate-400">
          {isSignup ? (
            <>
              Free, and it takes about ten seconds. You get the{" "}
              <span className="text-slate-200">GembyAV.exe</span> download plus the support
              assistant.
            </>
          ) : (
            <>Sign in to reach your download and the support assistant.</>
          )}
        </p>
      </div>

      {reason === "auth" ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-brand-400/25 bg-brand-400/[0.07] px-3.5 py-3 text-[0.82rem] text-brand-200">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            That page is for signed-in users. Sign in and we will send you straight back to{" "}
            <code className="font-mono text-[0.78rem]">{safeNext}</code>.
          </span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-alert-500/30 bg-alert-500/[0.09] px-3.5 py-3 text-[0.82rem] text-alert-200"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {isSignup ? (
          <Field label="Name">
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-600" />
              <Input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
                maxLength={60}
              />
            </div>
          </Field>
        ) : null}

        <Field label="Email">
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-600" />
            <Input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </Field>

        <Field
          label="Password"
          hint={isSignup ? "8 characters minimum" : undefined}
        >
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              name="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "Choose a strong password" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
              className="h-11 w-full rounded-xl border border-white/10 bg-abyss/70 pr-11 pl-3.5 text-sm text-slate-100 transition-colors placeholder:text-slate-600 focus:border-brand-400/60 focus:bg-abyss focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {isSignup && password.length > 0 ? (
          <div className="-mt-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i < strength ? COLORS[strength] : "bg-white/[0.08]"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[0.72rem] text-slate-500">
              Strength: <span className="text-slate-300">{LABELS[strength]}</span>
            </p>
          </div>
        ) : null}

        <Button type="submit" size="lg" loading={busy} className="w-full">
          {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          {!busy ? <ArrowRight className="size-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-[0.85rem] text-slate-400">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              href={`/signin${params.toString() ? `?${params.toString()}` : ""}`}
              className="font-medium text-brand-300 underline decoration-brand-400/40 underline-offset-2 hover:text-brand-200"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href={`/signup${params.toString() ? `?${params.toString()}` : ""}`}
              className="font-medium text-brand-300 underline decoration-brand-400/40 underline-offset-2 hover:text-brand-200"
            >
              Create a free account
            </Link>
          </>
        )}
      </p>

      <div className="mt-8 space-y-2.5 rounded-xl border border-white/[0.07] bg-panel/40 p-4">
        {[
          "Passwords are scrypt-hashed with a unique salt — never stored in plain text",
          "Sessions are signed httpOnly cookies, valid for 30 days",
          "No analytics, no advertising scripts, no third-party trackers",
        ].map((t) => (
          <p key={t} className="flex gap-2.5 text-[0.78rem] leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-mint-500" />
            {t}
          </p>
        ))}
        {!durable ? (
          <p className="flex gap-2.5 border-t border-white/[0.07] pt-2.5 text-[0.75rem] leading-relaxed text-slate-500">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-gold-400" />
            <span>
              This deployment has no database attached, so accounts live in this browser only.
              Add Upstash Redis credentials in Vercel to enable shared, multi-device accounts.
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AuthForm(props: { mode: Mode }) {
  return (
    <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-white/[0.04]" />}>
      <AuthFormInner {...props} />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function isSafeNext(next: string | null): next is string {
  // Only allow same-origin absolute paths to prevent open-redirect.
  return Boolean(next && next.startsWith("/") && !next.startsWith("//"));
}

function dashboardForRole(role: string | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "TECHNICIAN") return "/tech";
  return "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwdValid = password.length >= 6;
  const canSubmit = emailValid && pwdValid && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      const target = isSafeNext(next) ? next : dashboardForRole(user?.role);
      router.push(target);
      router.refresh();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials and try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container py-10 md:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_420px] items-start">
        {/* Left: brand panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:block"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white shadow-lg shadow-primary/30">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Fix<span className="text-primary">It</span>Now
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight">
            Welcome{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
              back
            </span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-md">
            Sign in to book trusted technicians, track your jobs, and manage
            your service history.
          </p>

          <ul className="mt-8 space-y-4 text-sm">
            {[
              "Verified technicians in your area",
              "Real-time booking and status updates",
              "Secure payments with Stripe",
            ].map((line) => (
              <li key={line} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="text-muted-foreground">{line}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right: form card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-center gap-2 lg:hidden mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white">
              <Wrench className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Fix<span className="text-primary">It</span>Now
            </span>
          </div>

          <h2 className="text-xl font-semibold">Sign in to your account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            New to FixItNow?{" "}
            <Link
              href={
                next
                  ? `/register?next=${encodeURIComponent(next)}`
                  : "/register"
              }
              className="text-primary hover:underline font-medium"
            >
              Create an account
            </Link>
          </p>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2 text-sm"
            >
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <span className="text-destructive">{error}</span>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium inline-flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={email.length > 0 && !emailValid}
              />
              {email.length > 0 && !emailValid ? (
                <p className="text-xs text-destructive">
                  Enter a valid email address.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium inline-flex items-center gap-1.5"
              >
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  aria-invalid={password.length > 0 && !pwdValid}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {password.length > 0 && !pwdValid ? (
                <p className="text-xs text-destructive">
                  Password must be at least 6 characters.
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className={cn("w-full")}
              size="lg"
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in you agree to our{" "}
            <Link href="/about" className="hover:underline">
              Terms
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense
        fallback={
          <div className="flex-1 grid place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

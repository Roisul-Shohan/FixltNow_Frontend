"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
  Wrench,
} from "lucide-react";

import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";

type Role = "CUSTOMER" | "TECHNICIAN";

function isSafeNext(next: string | null): next is string {
  return Boolean(next && next.startsWith("/") && !next.startsWith("//"));
}

function dashboardForRole(role: string | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "TECHNICIAN") return "/tech";
  return "/dashboard";
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const register = useAuthStore((s) => s.register);

  const next = params.get("next");

  const [role, setRole] = useState<Role>("CUSTOMER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYoe] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwdValid = password.length >= 6;
  const pwdMatch = password === confirm;
  const nameValid = name.trim().length >= 1;
  const yoeNum = yearsOfExperience ? Number(yearsOfExperience) : undefined;
  const yoeValid =
    role === "CUSTOMER" ||
    (yoeNum !== undefined && Number.isFinite(yoeNum) && yoeNum >= 0);
  const bioValid = role === "CUSTOMER" || bio.trim().length >= 1;

  const canSubmit =
    emailValid &&
    pwdValid &&
    pwdMatch &&
    nameValid &&
    yoeValid &&
    bioValid &&
    !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      };
      if (phone.trim()) payload.phone = phone.trim();
      if (role === "TECHNICIAN") {
        payload.bio = bio.trim();
        payload.yearsOfExperience = yoeNum;
      }
      const user = await register(payload);
      const target = isSafeNext(next) ? next : dashboardForRole(user?.role);
      router.push(target);
      router.refresh();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hero-overlay"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 dot-grid opacity-50"
      />

      <div className="container py-10 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_500px] items-start">
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
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              Join{" "}
              <span className="text-gradient">FixItNow</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-md">
              Create an account to book services or grow your business as a
              technician in your area.
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              {[
                {
                  title: "Pick your role",
                  desc: "Customer or technician — switch any time",
                },
                {
                  title: "All-in-one history",
                  desc: "Bookings, payments, and conversations in one place",
                },
                {
                  title: "Built-in availability",
                  desc: "Technicians manage slots directly from the dashboard",
                },
              ].map((line) => (
                <li
                  key={line.title}
                  className="card-premium card-halo flex items-start gap-3 p-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-medium">{line.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {line.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: form card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="card-premium card-halo p-6 sm:p-8"
          >
          <div className="flex items-center gap-2 lg:hidden mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white">
              <Wrench className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Fix<span className="text-primary">It</span>Now
            </span>
          </div>

          <h2 className="text-xl font-semibold">Create your account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Already have one?{" "}
            <Link
              href={
                next
                  ? `/login?next=${encodeURIComponent(next)}`
                  : "/login"
              }
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>

          {/* Role selector */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-1">
            {([
              { value: "CUSTOMER", label: "Customer", icon: UserIcon },
              {
                value: "TECHNICIAN",
                label: "Technician",
                icon: Wrench,
              },
            ] as const).map((opt) => {
              const Icon = opt.icon;
              const active = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={active}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2 text-sm"
            >
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <span className="text-destructive">{error}</span>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-sm font-medium inline-flex items-center gap-1.5"
              >
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Full name
              </label>
              <Input
                id="name"
                required
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={name.length > 0 && !nameValid}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="r-email"
                className="text-sm font-medium inline-flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </label>
              <Input
                id="r-email"
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
                htmlFor="r-phone"
                className="text-sm font-medium inline-flex items-center gap-1.5"
              >
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </label>
              <Input
                id="r-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+880 1XXX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="r-password"
                  className="text-sm font-medium inline-flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="r-password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="new-password"
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
                    aria-label={
                      showPwd ? "Hide password" : "Show password"
                    }
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
                    At least 6 characters.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="r-confirm"
                  className="text-sm font-medium inline-flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Confirm
                </label>
                <Input
                  id="r-confirm"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={confirm.length > 0 && !pwdMatch}
                />
                {confirm.length > 0 && !pwdMatch ? (
                  <p className="text-xs text-destructive">
                    Passwords don&apos;t match.
                  </p>
                ) : null}
              </div>
            </div>

            {role === "TECHNICIAN" ? (
              <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Technician details
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="bio"
                    className="text-sm font-medium inline-flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Short bio
                  </label>
                  <textarea
                    id="bio"
                    required
                    rows={3}
                    placeholder="Tell customers about your expertise, certifications, and years of work."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={bio.length > 0 && !bioValid}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="yoe"
                    className="text-sm font-medium inline-flex items-center gap-1.5"
                  >
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    Years of experience
                  </label>
                  <Input
                    id="yoe"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={70}
                    step={1}
                    required
                    placeholder="e.g. 5"
                    value={yearsOfExperience}
                    onChange={(e) => setYoe(e.target.value)}
                    aria-invalid={
                      yearsOfExperience.length > 0 && !yoeValid
                    }
                  />
                  {yearsOfExperience.length > 0 && !yoeValid ? (
                    <p className="text-xs text-destructive">
                      Enter a non-negative number.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By creating an account you agree to our{" "}
            <Link href="/about" className="hover:underline">
              Terms
            </Link>
            .
          </p>
        </motion.div>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <>
      <PublicNavbar />
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="grid min-h-[50vh] place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </div>
      <PublicFooter />
    </>
  );
}
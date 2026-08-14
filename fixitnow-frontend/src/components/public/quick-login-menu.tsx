"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Loader2,
  LogIn,
  UserCog,
  UserRound,
  Wrench,
} from "lucide-react";

import { useAuthStore } from "@/hooks/use-auth-store";
import { cn } from "@/lib/utils";

// Quick-login shortcuts — click fills the form credentials and signs in.
//   • Admin password is stored in plain text (matches auth.service.ts branch).
//   • Customer + technician passwords are stored as bcrypt hashes; the literal
//     strings below are what the user types in the password field.
type QuickLoginProfile = {
  id: "admin" | "technician" | "customer";
  label: string;
  email: string;
  password: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const QUICK_LOGIN_PROFILES: QuickLoginProfile[] = [
  {
    id: "admin",
    label: "Login as Admin",
    email: "admin@gmail.com",
    password: "aaaaaaaaaaaaaaa",
    icon: UserCog,
  },
  {
    id: "technician",
    label: "Login as Technician",
    email: "roisul101@gmail.com",
    password: "123456",
    icon: Wrench,
  },
  {
    id: "customer",
    label: "Login as Customer",
    email: "roisul192@gmail.com",
    password: "123456",
    icon: UserRound,
  },
];

function dashboardForRole(role: string | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "TECHNICIAN") return "/tech";
  return "/dashboard";
}

type Props = {
  /** Visual variant: "navbar" (light pill on dark/light header), "card" (filled button inside a card). */
  variant?: "navbar" | "card";
};

export function QuickLoginMenu({ variant = "navbar" }: Props) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<QuickLoginProfile["id"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // If the user is already logged in, hide the menu — it's purely a guest shortcut.
  if (user) return null;

  async function runQuickLogin(profile: QuickLoginProfile) {
    if (busyId) return;
    setError(null);
    setBusyId(profile.id);
    try {
      const u = await login(profile.email, profile.password);
      setOpen(false);
      router.push(dashboardForRole(u?.role));
      router.refresh();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials and try again.";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  }

  const isNavbar = variant === "navbar";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          isNavbar
            ? "border border-border/60 bg-card/60 text-foreground hover:bg-card"
            : "border bg-muted/50 text-foreground hover:bg-muted"
        )}
      >
        <LogIn className="h-3.5 w-3.5" />
        Quick login
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border bg-popover shadow-lg ring-1 ring-black/5"
        >
          {QUICK_LOGIN_PROFILES.map((p) => {
            const Icon = p.icon;
            const isBusy = busyId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="menuitem"
                onClick={() => runQuickLogin(p)}
                disabled={busyId !== null}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none disabled:opacity-60"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {isBusy ? `Signing in as ${p.label.replace("Login as ", "")}…` : p.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {p.email}
                  </span>
                </span>
                {isBusy ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : null}
              </button>
            );
          })}
          {error ? (
            <div className="border-t bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
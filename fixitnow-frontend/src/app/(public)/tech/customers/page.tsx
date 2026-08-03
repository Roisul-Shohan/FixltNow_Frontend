"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Users,
  Wallet,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT, safeFormatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

/* ----------------------- Types ----------------------- */

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

interface CustomerLite {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
}

interface CustomerRow {
  customer: CustomerLite | null;
  completedBookings: number;
  totalSpent: number | string;
  lastBookingDate: string | null;
}

interface CustomersPayload {
  data: CustomerRow[];
  meta: { page: number; limit: number; total: number };
}

/* ----------------------- Page ----------------------- */

export default function TechnicianCustomersPage() {
  const [query, setQuery] = useState("");

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<CustomerRow[]>
  >({
    queryKey: ["tech-customers"],
    queryFn: async () => {
      const res = await api.get("/technicians/me/customers", {
        params: { limit: 100 },
      });
      return res.data;
    },
    staleTime: 30_000,
  });

  const rows = useMemo<CustomerRow[]>(() => {
    const raw = data?.data;
    const list = Array.isArray(raw) ? raw : [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((r) => {
      const c = r.customer;
      if (!c) return false;
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    });
  }, [data, query]);

  const totals = useMemo(() => {
    const list: CustomerRow[] = Array.isArray(data?.data) ? data!.data : [];
    return {
      customers: list.length,
      totalSpent: list.reduce(
        (acc, r) => acc + Number(r.totalSpent ?? 0),
        0
      ),
      totalJobs: list.reduce((acc, r) => acc + Number(r.completedBookings ?? 0), 0),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <Header />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <SummaryCard
          label="Customers"
          value={totals.customers}
          icon={Users}
          accent="primary"
        />
        <SummaryCard
          label="Completed jobs"
          value={totals.totalJobs}
          icon={CheckCircle2}
          accent="cyan"
        />
        <SummaryCard
          label="Lifetime revenue"
          value={formatBDT(totals.totalSpent)}
          icon={Wallet}
          accent="emerald"
        />
      </section>

      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Find a customer</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      <section>
        {isError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-destructive">
                Couldn&apos;t load your customers.
              </p>
              <p className="text-muted-foreground mt-1">
                {(error as any)?.response?.data?.message ||
                  (error as any)?.message ||
                  "Please try again."}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Empty query={query} />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row, idx) => (
              <CustomerCard key={row.customer?.id ?? idx} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------- Pieces ---------- */

function Header() {
  return (
    <header>
      <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
        <Users className="h-3.5 w-3.5" />
        Customers
      </div>
      <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
        Your customer list
      </h1>
      <p className="text-sm md:text-base text-muted-foreground mt-1">
        Everyone who has booked and completed a job with you.
      </p>
    </header>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "cyan" | "emerald";
}) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            accentClass
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
        {value}
      </div>
    </motion.div>
  );
}

function CustomerCard({ row }: { row: CustomerRow }) {
  const c = row.customer;
  const name = c?.name ?? "Unknown customer";
  const email = c?.email ?? "";
  const phone = c?.phone ?? null;
  const initial = name.charAt(0).toUpperCase();

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-4 sm:p-5 transition-all hover:shadow-md hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-bold text-base overflow-hidden">
          {c?.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.profileImage}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate" title={name}>
            {name}
          </h3>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary truncate max-w-full"
            >
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{email}</span>
            </a>
          ) : null}
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <Phone className="h-3 w-3 shrink-0" />
              <span>{phone}</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat
          label="Jobs"
          value={String(row.completedBookings ?? 0)}
          icon={CheckCircle2}
          tone="cyan"
        />
        <Stat
          label="Spent"
          value={formatBDT(row.totalSpent ?? 0)}
          icon={Wallet}
          tone="emerald"
        />
        <Stat
          label="Last"
          value={
            row.lastBookingDate ? safeFormatDate(row.lastBookingDate, "MMM d") : "—"
          }
          icon={CalendarDays}
          tone="primary"
        />
      </div>

      <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
        Booking history only counts completed jobs.
      </div>
    </motion.li>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "cyan" | "emerald" | "primary";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }[tone];

  return (
    <div className="rounded-lg border bg-background/50 p-2">
      <div
        className={cn(
          "mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-md",
          toneClass
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="text-sm font-semibold truncate" title={value}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Empty({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">
        {query ? "No matching customers" : "No customers yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        {query
          ? "Try a different search term, or clear the search to see all customers."
          : "When customers book and complete a service with you, they'll show up here."}
      </p>
      {!query && (
        <Link
          href="/tech/availability"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Update availability
        </Link>
      )}
    </div>
  );
}
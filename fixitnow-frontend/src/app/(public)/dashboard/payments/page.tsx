"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck2,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT, toDate, safeFormatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}

interface PaymentTechnician {
  id: string;
  user: {
    name: string;
    profileImage?: string | null;
  };
}

interface PaymentBooking {
  id: string;
  bookingDate: string;
  status: string;
  service?: { title: string };
  technician?: PaymentTechnician;
}

interface PaymentRow {
  id: string;
  amount: number | string;
  currency?: string;
  paidAt: string | null;
  paymentMethod?: string | null;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  booking: PaymentBooking;
}

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function CustomerPaymentsPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<ApiSuccess<PaymentRow[]>>({
    queryKey: ["customer-payments"],
    queryFn: async () => (await api.get("/payments")).data,
    staleTime: 30_000,
  });

  const rows = useMemo<PaymentRow[]>(() => {
    const raw = (data as any)?.data;
    return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  }, [data]);

  const successful = useMemo(
    () => rows.filter((p) => p.status === "SUCCEEDED"),
    [rows]
  );

  const totals = useMemo(() => {
    const total = successful.reduce(
      (sum, p) => sum + Number(p.amount ?? 0),
      0
    );
    const avg = successful.length > 0 ? total / successful.length : 0;
    return { total, avg, count: successful.length };
  }, [successful]);

  const months = useMemo(() => {
    // Build last 12 months buckets
    const now = new Date();
    const buckets: { key: string; label: string; amount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${monthLabels[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      buckets.push({ key, label, amount: 0 });
    }
    for (const p of successful) {
      const d = toDate(p.paidAt);
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.amount += Number(p.amount ?? 0);
    }
    return buckets;
  }, [successful]);

  const lastMonth = months[months.length - 1];
  const prevMonth = months[months.length - 2];

  const monthDelta = useMemo(() => {
    if (!lastMonth) return null;
    if (!prevMonth || prevMonth.amount === 0) {
      return lastMonth.amount > 0 ? "new" : "flat";
    }
    const diff = lastMonth.amount - prevMonth.amount;
    const pct = (diff / prevMonth.amount) * 100;
    return { pct, up: diff >= 0 };
  }, [lastMonth, prevMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-cyan-400/10 to-sky-400/5 px-6 py-10 md:px-10 md:py-14">
          <div className="hero-overlay absolute inset-0 -z-10" />
          <div className="relative flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
            >
              <Wallet className="h-3.5 w-3.5" />
              Payments
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl md:text-5xl font-bold tracking-tight"
            >
              Your{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                payments
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="max-w-xl text-sm md:text-base text-muted-foreground"
            >
              Track what you&apos;ve paid for completed bookings, by month.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    isRefetching && "animate-spin"
                  )}
                />
                Refresh
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/bookings">
                  <CalendarCheck2 className="h-4 w-4" />
                  My bookings
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total spent"
          value={formatBDT(totals.total)}
          icon={Wallet}
        />
        <StatTile
          label="This month"
          value={lastMonth ? formatBDT(lastMonth.amount) : "—"}
          icon={TrendingUp}
          trend={
            monthDelta === null
              ? null
              : monthDelta === "new"
              ? { up: true, label: "New" }
              : monthDelta === "flat"
              ? { up: true, label: "Flat" }
              : {
                  up: monthDelta.up,
                  label: `${Math.abs(monthDelta.pct).toFixed(0)}%`,
                }
          }
        />
        <StatTile
          label="Avg per booking"
          value={formatBDT(totals.avg)}
          icon={CreditCard}
        />
        <StatTile
          label="Total payments"
          value={String(totals.count)}
          icon={CreditCard}
        />
      </section>

      {/* Monthly chart */}
      <section className="rounded-2xl border bg-card p-5 md:p-6">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold tracking-tight">Monthly spending</h2>
            <p className="text-xs text-muted-foreground">Last 12 months</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            BDT
          </Badge>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-12 gap-2 h-48">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-md bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <MonthlyChart months={months} />
        )}
      </section>

      {/* Payment history */}
      <section>
        <h2 className="mb-4 font-semibold tracking-tight">Payment history</h2>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card p-4 animate-pulse h-20"
              />
            ))}
          </div>
        ) : isError ? (
          <ErrorPanel
            message={
              (error as any)?.response?.data?.message ||
              (error as any)?.message ||
              "Failed to load payments"
            }
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {rows.map((p) => (
              <PaymentRowItem key={p.id} payment={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------- Components ---------- */

function StatTile({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { up: boolean; label: string } | null;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      {trend ? (
        <div
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs font-medium",
            trend.up ? "text-emerald-600" : "text-rose-600"
          )}
        >
          {trend.up ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {trend.label}
        </div>
      ) : null}
    </div>
  );
}

function MonthlyChart({
  months,
}: {
  months: { key: string; label: string; amount: number }[];
}) {
  const max = Math.max(...months.map((m) => m.amount), 1);
  const lastIdx = months.length - 1;

  return (
    <div className="grid grid-cols-12 gap-2 h-56 items-end">
      {months.map((m, i) => {
        const pct = (m.amount / max) * 100;
        const isLast = i === lastIdx;
        return (
          <div
            key={m.key}
            className="flex h-full flex-col items-center justify-end gap-1.5"
            title={`${m.label}: ${formatBDT(m.amount)}`}
          >
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {m.amount > 0 ? shortBDT(m.amount) : ""}
            </span>
            <div
              className={cn(
                "w-full rounded-t-md transition-all",
                isLast
                  ? "bg-gradient-to-t from-primary to-cyan-400"
                  : "bg-muted hover:bg-muted-foreground/20",
                pct < 1 && "h-1"
              )}
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <span
              className={cn(
                "text-[10px]",
                isLast
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              )}
            >
              {m.label.split(" ")[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PaymentRowItem({ payment }: { payment: PaymentRow }) {
  const date = toDate(payment.paidAt);
  const techName = payment.booking?.technician?.user?.name ?? "Technician";
  return (
    <li className="rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/40 transition-all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white flex items-center justify-center">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold tracking-tight truncate">
                {payment.booking?.service?.title ?? "Service"}
              </h3>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              to {techName}
              {payment.paymentMethod ? ` • ${payment.paymentMethod}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-primary">
            {formatBDT(payment.amount)}
          </div>
          {date ? (
            <div className="text-[10px] text-muted-foreground">
              {safeFormatDate(payment.paidAt, "—", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground">—</div>
          )}
        </div>
      </div>
    </li>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
}) {
  const map: Record<string, { variant: any; label: string }> = {
    SUCCEEDED: { variant: "success", label: "Paid" },
    PENDING: { variant: "warning", label: "Pending" },
    FAILED: { variant: "destructive", label: "Failed" },
    REFUNDED: { variant: "secondary", label: "Refunded" },
  };
  const cfg = map[status] ?? { variant: "secondary", label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Wallet className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">No payments yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Payments appear after you complete a paid booking.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/services">Browse services</Link>
      </Button>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
      <p className="font-semibold text-destructive">
        Couldn&apos;t load payments
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-3">
        Try again
      </Button>
    </div>
  );
}

function shortBDT(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}k`;
  return String(amount);
}
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck2,
  CreditCard,
  Loader2,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ----------------------- Types ----------------------- */

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}

interface EarningsCustomer {
  id: string;
  name: string;
  profileImage?: string | null;
}

interface EarningsService {
  id: string;
  title: string;
}

interface EarningsBooking {
  id: string;
  bookingDate: string;
  status: string;
  service?: EarningsService;
  customer?: EarningsCustomer;
}

interface PaymentRow {
  id: string;
  amount: number;
  currency?: string;
  paidAt: string | null;
  paymentMethod?: string | null;
  booking: EarningsBooking;
}

interface EarningsStats {
  totalEarnings: number;
  averagePayment: number;
  totalPayments: number;
}

interface MonthBucket {
  month: string; // "YYYY-MM"
  amount: number;
}

interface EarningsPayload {
  payments: PaymentRow[];
  stats: EarningsStats;
  earningsByMonth: MonthBucket[];
  meta?: { page: number; limit: number; total: number };
}

/* ----------------------- Page ----------------------- */

export default function TechnicianEarningsPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<ApiSuccess<EarningsPayload>>({
    queryKey: ["tech-earnings"],
    queryFn: async () => (await api.get("/technicians/me/earnings")).data,
    staleTime: 30_000,
  });

  const payload = data?.data;
  const payments = useMemo<PaymentRow[]>(
    () => payload?.payments ?? [],
    [payload?.payments]
  );
  const stats = payload?.stats ?? {
    totalEarnings: 0,
    averagePayment: 0,
    totalPayments: payments.length,
  };
  const months = useMemo<MonthBucket[]>(
    () => payload?.earningsByMonth ?? [],
    [payload?.earningsByMonth]
  );

  const lastMonth = months.length > 0 ? months[months.length - 1] : undefined;
  const prevMonth = months.length > 1 ? months[months.length - 2] : undefined;

  const monthDelta = useMemo(() => {
    if (!lastMonth) return null;
    if (!prevMonth || prevMonth.amount === 0) {
      return lastMonth.amount > 0 ? "new" : "flat";
    }
    const diff = lastMonth.amount - prevMonth.amount;
    const pct = (diff / prevMonth.amount) * 100;
    return { pct, up: diff >= 0, diff };
  }, [lastMonth, prevMonth]);

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <section className="mb-10">
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
              Earnings
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl md:text-5xl font-bold tracking-tight"
            >
              Your{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                earnings
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="max-w-xl text-sm md:text-base text-muted-foreground"
            >
              Track your monthly earnings and review past payments.
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
                <Link href="/tech/bookings">
                  <CalendarCheck2 className="h-4 w-4" />
                  Bookings
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total earnings"
          value={formatBDT(stats.totalEarnings)}
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
          value={formatBDT(stats.averagePayment)}
          icon={CreditCard}
        />
        <StatTile
          label="Total payments"
          value={String(stats.totalPayments)}
          icon={CreditCard}
        />
      </section>

      {/* Monthly chart */}
      <section className="mb-8 rounded-2xl border bg-card p-5 md:p-6">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold tracking-tight">Monthly earnings</h2>
            <p className="text-xs text-muted-foreground">
              Last {months.length || 12} months
            </p>
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
        ) : months.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No earnings data yet.
          </p>
        ) : (
          <MonthlyChart months={months} />
        )}
      </section>

      {/* Payment history */}
      <section>
        <h2 className="mb-4 font-semibold tracking-tight">
          Payment history
        </h2>

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
              "Failed to load earnings"
            }
            onRetry={() => refetch()}
          />
        ) : payments.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <PaymentRowItem key={p.id} payment={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ----------------------- Components ----------------------- */

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

function MonthlyChart({ months }: { months: MonthBucket[] }) {
  const max = Math.max(...months.map((m) => m.amount), 1);
  const lastIdx = months.length - 1;

  return (
    <div className="grid grid-cols-12 gap-2 h-56 items-end">
      {months.map((m, i) => {
        const pct = (m.amount / max) * 100;
        const isLast = i === lastIdx;
        const monthLabel = monthLabelFromKey(m.month);
        return (
          <div
            key={m.month}
            className="flex h-full flex-col items-center justify-end gap-1.5"
            title={`${monthLabel}: ${formatBDT(m.amount)}`}
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
              {monthLabel.split(" ")[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PaymentRowItem({ payment }: { payment: PaymentRow }) {
  const date = payment.paidAt ? new Date(payment.paidAt) : null;
  const customerName = payment.booking?.customer?.name ?? "Customer";

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
              <Badge variant="success">Paid</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              from {customerName}
              {payment.paymentMethod
                ? ` • ${payment.paymentMethod}`
                : ""}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-primary">
            {formatBDT(payment.amount)}
          </div>
          {date ? (
            <div className="text-[10px] text-muted-foreground">
              {date.toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Wallet className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">No payments yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Earnings appear after customers pay for completed bookings.
      </p>
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
      <p className="font-semibold text-destructive">Couldn&apos;t load earnings</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-3">
        Try again
      </Button>
    </div>
  );
}

/* ----------------------- Helpers ----------------------- */

function monthLabelFromKey(key: string): string {
  // "YYYY-MM"
  const [y, m] = key.split("-");
  const monthNames = [
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
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return key;
  return `${monthNames[idx]} ${y?.slice(2)}`;
}

function shortBDT(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}k`;
  return String(amount);
}
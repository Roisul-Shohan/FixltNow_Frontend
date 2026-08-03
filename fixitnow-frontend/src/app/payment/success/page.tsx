"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { safeFormatDate, safeFormatTime, cn } from "@/lib/utils";

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaymentBooking {
  id: string;
  bookingDate: string;
  status: string;
  service?: { id: string; title: string };
  technician?: { user?: { name?: string } };
}

interface PaymentRow {
  id: string;
  amount: number | string;
  currency?: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  paidAt: string | null;
  createdAt?: string;
  paymentMethod?: string | null;
  booking: PaymentBooking;
}

function formatBDT(amount: number | string) {
  const numeric =
    typeof amount === "number"
      ? amount
      : typeof amount === "string" && amount.trim() !== ""
      ? Number(amount)
      : NaN;
  const value = Number.isFinite(numeric) ? Math.round(numeric) : 0;
  return `৳${value.toLocaleString("en-US")}`;
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Centered>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading your receipt…
          </p>
        </Centered>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");

  // We don&apos;t have a backend endpoint that maps a Stripe session id back to
  // a payment row, so we look up the most recent successful payment for the
  // signed-in user. The webhook marks it SUCCEEDED; the user typically
  // arrives here within a couple of seconds.
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<
    ApiSuccess<PaymentRow[]>
  >({
    queryKey: ["customer-latest-payment", sessionId],
    queryFn: async () => (await api.get("/payments?limit=5")).data,
    staleTime: 0,
    refetchInterval: (q) => {
      const list = (q.state.data as any)?.data;
      if (Array.isArray(list) && list.some((p) => p.status === "SUCCEEDED")) {
        return false;
      }
      return 3000;
    },
  });

  const rows: PaymentRow[] = useMemo(() => {
    const raw = (data as any)?.data;
    return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  }, [data]);

  // Prefer a SUCCEEDED payment; otherwise show the most recent one
  const payment =
    rows.find((p) => p.status === "SUCCEEDED") ?? rows[0] ?? null;

  const state: "loading" | "success" | "pending" | "error" = isLoading
    ? "loading"
    : isError
    ? "error"
    : payment
    ? payment.status === "SUCCEEDED"
      ? "success"
      : payment.status === "PENDING"
      ? "pending"
      : "error"
    : "pending";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 via-background to-cyan-400/5">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className={cn(
            "mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-xl",
            state === "success"
              ? "bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-emerald-500/30"
              : state === "pending"
              ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
              : state === "error"
              ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {state === "loading" ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : state === "success" ? (
            <CheckCircle2 className="h-10 w-10" />
          ) : state === "pending" ? (
            <Clock className="h-10 w-10" />
          ) : (
            <XCircle className="h-10 w-10" />
          )}
        </motion.div>

        <motion.h1
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold tracking-tight"
        >
          {state === "success"
            ? "Payment successful"
            : state === "pending"
            ? "Almost there…"
            : state === "error"
            ? "We couldn’t confirm your payment"
            : "Confirming your payment"}
        </motion.h1>

        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="mt-3 max-w-md text-sm md:text-base text-muted-foreground"
        >
          {state === "success"
            ? "Thanks! Your booking is paid and your technician has been notified."
            : state === "pending"
            ? "Stripe is still finalising the charge. This page will update automatically."
            : state === "error"
            ? "If you were charged, the booking will still be marked as paid within a few seconds. Otherwise, please retry from your bookings page."
            : "Hang tight while we verify the transaction with Stripe."}
        </motion.p>

        {sessionId ? (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-[11px] font-mono text-muted-foreground">
            <span className="uppercase tracking-wider">session</span>
            <span className="truncate max-w-[180px]">{sessionId}</span>
          </div>
        ) : null}

        {/* Receipt */}
        {payment ? (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-8 w-full overflow-hidden rounded-2xl border bg-card text-left shadow-sm"
          >
            <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Receipt</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <dl className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
              <Detail
                label="Service"
                value={payment.booking?.service?.title ?? "—"}
              />
              <Detail
                label="Technician"
                value={
                  payment.booking?.technician?.user?.name ?? "—"
                }
              />
              <Detail
                label="Booked for"
                value={
                  payment.booking?.bookingDate
                    ? `${safeFormatDate(payment.booking.bookingDate)} · ${safeFormatTime(
                        payment.booking.bookingDate
                      )}`
                    : "—"
                }
              />
              <Detail
                label="Method"
                value={payment.paymentMethod ?? "Card"}
              />
              <Detail
                label="Paid at"
                value={
                  payment.paidAt
                    ? `${safeFormatDate(payment.paidAt)} · ${safeFormatTime(
                        payment.paidAt
                      )}`
                    : "Awaiting confirmation"
                }
              />
              <Detail
                label="Amount"
                value={formatBDT(payment.amount)}
                accent
              />
            </dl>
          </motion.div>
        ) : null}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => router.replace("/dashboard/bookings")}>
            View my bookings
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/payments">
              <CreditCard className="h-4 w-4" />
              Payment history
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        <p className="mt-10 max-w-md text-xs text-muted-foreground">
          A confirmation has been sent to your registered email. If you don’t
          see it within a few minutes, check your spam folder or contact
          support.
        </p>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-sm",
          accent ? "text-2xl font-bold text-primary" : "font-medium"
        )}
      >
        {value}
      </dd>
    </div>
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-primary/5 via-background to-cyan-400/5">
      <div className="flex flex-col items-center text-center">{children}</div>
    </div>
  );
}
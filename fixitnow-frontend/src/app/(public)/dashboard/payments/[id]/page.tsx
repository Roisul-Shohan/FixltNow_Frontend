"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  Loader2,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Wrench,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT, formatDate, formatTime } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess } from "@/types";

interface PaymentDetail {
  id: string;
  amount: number | string;
  status: "PENDING" | "PAID" | "SUCCESS" | "FAILED" | "REFUNDED";
  method?: string | null;
  transactionId?: string | null;
  createdAt: string;
  paidAt?: string | null;
  booking?: {
    id: string;
    status: string;
    bookingDate: string;
    startTime?: string;
    endTime?: string;
    service?: { id: string; title: string };
    technician?: {
      id: string;
      user?: { id: string; name: string; profileImage?: string | null };
    };
  };
}

const STATUS_META: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "info" | "secondary"; icon: React.ComponentType<{ className?: string }> }
> = {
  SUCCESS: { label: "Paid", variant: "success", icon: CheckCircle2 },
  PAID: { label: "Paid", variant: "success", icon: CheckCircle2 },
  PENDING: { label: "Pending", variant: "warning", icon: Clock },
  FAILED: { label: "Failed", variant: "destructive", icon: XCircle },
  REFUNDED: { label: "Refunded", variant: "info", icon: ShieldCheck },
};

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const me = useAuthStore((s) => s.user);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<PaymentDetail>
  >({
    queryKey: ["payment-detail", id],
    queryFn: async () => (await api.get(`/payments/${id}`)).data,
    enabled: Boolean(id),
    staleTime: 15_000,
  });

  const payment = (data?.data ?? null) as PaymentDetail | null;

  if (isLoading) {
    return (
      <div className="py-8 md:py-12 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div className="py-8 md:py-12 max-w-4xl mx-auto">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/payments">
            <ArrowLeft className="h-4 w-4" />
            Back to payments
          </Link>
        </Button>
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">
                Couldn't load this payment
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {(error as any)?.response?.data?.message ||
                  (error as any)?.message ||
                  "It may have been deleted, or you don't have access."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[payment.status] || STATUS_META.PENDING;
  const StatusIcon = statusMeta.icon;
  const isSuccess = payment.status === "SUCCESS" || payment.status === "PAID";

  return (
    <div className="py-8 md:py-12 max-w-4xl mx-auto">
      <div className="text-xs text-muted-foreground mb-3">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/dashboard/payments" className="hover:text-foreground transition-colors">
          Payments
        </Link>
        <span className="mx-1.5">/</span>
        <span className="font-mono">{payment.id.slice(0, 8)}</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Receipt className="h-3.5 w-3.5" />
            Payment receipt
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            {formatBDT(Number(payment.amount))}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatDate(payment.createdAt)}
          </p>
        </div>
        <Badge variant={statusMeta.variant} className="inline-flex items-center gap-1.5 text-sm px-3 py-1">
          <StatusIcon className="h-4 w-4" />
          {statusMeta.label}
        </Badge>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Amount */}
          <section
            className={cn(
              "card-premium card-halo p-6 relative overflow-hidden",
              isSuccess && "border-success/30"
            )}
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-4xl font-bold mt-1">
                {formatBDT(Number(payment.amount))}
              </p>
              {isSuccess ? (
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Payment received
                </p>
              ) : null}
            </div>
          </section>

          {/* Details */}
          <section className="card-premium card-halo p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Transaction details
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Method</dt>
                <dd className="font-medium">
                  {payment.method || "Stripe Checkout"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="font-medium">{formatDate(payment.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Paid at</dt>
                <dd className="font-medium">
                  {payment.paidAt ? formatDate(payment.paidAt) : "—"}
                </dd>
              </div>
              {payment.transactionId ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Transaction ID</dt>
                  <dd className="font-mono text-xs break-all">
                    {payment.transactionId}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {/* Booking link */}
          {payment.booking ? (
            <section className="card-premium card-halo p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Linked booking
              </h2>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {payment.booking.service?.title || "Booking"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(payment.booking.bookingDate)}
                    {payment.booking.startTime && payment.booking.endTime
                      ? ` · ${formatTime(payment.booking.startTime)} – ${formatTime(payment.booking.endTime)}`
                      : null}{" "}
                    · {payment.booking.status}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/bookings/${payment.booking.id}`}>
                    View booking
                  </Link>
                </Button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          {/* Parties */}
          {payment.booking?.technician ? (
            <section className="card-premium card-halo p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Technician
              </h2>
              <p className="font-medium">
                {payment.booking.technician.user?.name || "Technician"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                asChild
              >
                <Link href={`/technicians/${payment.booking.technician.id}`}>
                  View profile
                </Link>
              </Button>
            </section>
          ) : null}

          {/* Reference */}
          <section className="card-premium card-halo p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Reference
            </h2>
            <p className="text-xs text-muted-foreground">Payment ID</p>
            <p className="font-mono text-xs break-all">{payment.id}</p>
            {payment.booking?.id ? (
              <>
                <p className="text-xs text-muted-foreground mt-3">Booking ID</p>
                <p className="font-mono text-xs break-all">
                  {payment.booking.id}
                </p>
              </>
            ) : null}
          </section>

          <Button variant="ghost" className="w-full" onClick={() => refetch()}>
            <RefreshCw
              className={cn("h-4 w-4", isRefetching && "animate-spin")}
            />
            Refresh
          </Button>
        </aside>
      </div>
    </div>
  );
}

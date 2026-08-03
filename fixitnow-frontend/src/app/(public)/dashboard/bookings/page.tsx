"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Star,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { ApiSuccess, BookingStatus } from "@/types";

interface BookingService {
  id: string;
  title: string;
}

interface BookingTechnician {
  id: string;
  name: string;
  profileImage?: string | null;
}

interface BookingRow {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number | string;
  customerAddress?: string;
  service?: BookingService;
  technician?: BookingTechnician;
  payment?: {
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  };
  createdAt?: string;
}

const STATUS_FILTERS: { key: "ALL" | BookingStatus; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PAID", label: "Paid" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function CustomerBookingsPage() {
  const [status, setStatus] = useState<"ALL" | BookingStatus>("ALL");
  const [query, setQuery] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<BookingRow[]> & { meta?: { page: number; limit: number; total: number } }
  >({
    queryKey: ["customer-bookings", status],
    queryFn: async () => {
      const params =
        status === "ALL"
          ? undefined
          : { params: { status, limit: 50 } };
      const res = await api.get("/bookings", params);
      return res.data;
    },
    staleTime: 15_000,
  });

  const rows: BookingRow[] = useMemo(() => {
    const raw = (data as any)?.data;
    const arr: BookingRow[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : [];
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((b) => {
      return (
        b.id?.toLowerCase().includes(q) ||
        b.service?.title?.toLowerCase().includes(q) ||
        b.technician?.name?.toLowerCase().includes(q) ||
        b.customerAddress?.toLowerCase().includes(q)
      );
    });
  }, [data, query]);

  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/bookings/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Booking cancelled");
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
      qc.invalidateQueries({ queryKey: ["customer-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to cancel"
      );
    },
  });

  const payBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await api.post("/payments/create", { bookingId });
      return res.data;
    },
    onSuccess: (data: any) => {
      const url = data?.data?.checkoutUrl || data?.checkoutUrl;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success("Stripe checkout opened");
      } else {
        toast.success("Payment session created");
      }
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
      qc.invalidateQueries({ queryKey: ["customer-payments"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to start payment"
      );
    },
  });

  const totals = useMemo(() => {
    const arr = (data as any)?.data;
    const list: BookingRow[] = Array.isArray(arr) ? arr : [];
    return {
      all: list.length,
      pending: list.filter((b) => b.status === "PENDING").length,
      active: list.filter((b) =>
        ["ACCEPTED", "PAID"].includes(b.status as string)
      ).length,
      completed: list.filter((b) => b.status === "COMPLETED").length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <Header onRefresh={() => refetch()} isRefetching={isRefetching} />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <SummaryCard label="Total" value={totals.all} icon={Calendar} />
        <SummaryCard label="Pending" value={totals.pending} icon={Clock} />
        <SummaryCard label="Active" value={totals.active} icon={Wallet} />
        <SummaryCard
          label="Completed"
          value={totals.completed}
          icon={CheckCircle2}
        />
      </section>

      {/* Filters */}
      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filter bookings</h3>
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

        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                status === s.key
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-background hover:bg-accent text-foreground/80"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service, technician, address, or booking id…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Error / Empty / List */}
      <section>
        {isError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-destructive">
                Couldn&apos;t load your bookings.
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
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-3">
            {rows.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                cancelling={cancelBooking.isPending}
                paying={payBooking.isPending}
                onCancel={() => cancelBooking.mutate(b.id)}
                onPay={() => payBooking.mutate(b.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------- Pieces ---------- */

function Header({
  onRefresh,
  isRefetching,
}: {
  onRefresh: () => void;
  isRefetching: boolean;
}) {
  return (
    <header>
      <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
        <CalendarCheck2 className="h-3.5 w-3.5" />
        My Bookings
      </div>
      <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
        Manage your bookings
      </h1>
      <p className="text-sm md:text-base text-muted-foreground mt-1">
        Track your requests, pay accepted jobs, and review completed work.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 sm:hidden">
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefetching}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefetching && "animate-spin")}
          />
          Refresh
        </Button>
      </div>
    </header>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
        {value}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Calendar className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">No bookings match</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Try a different status filter or search term.
      </p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/services">Browse services to get started →</Link>
      </Button>
    </div>
  );
}

function BookingCard({
  booking,
  cancelling,
  paying,
  onCancel,
  onPay,
}: {
  booking: BookingRow;
  cancelling: boolean;
  paying: boolean;
  onCancel: () => void;
  onPay: () => void;
}) {
  const techName = booking.technician?.name ?? "Technician";
  const techInitial = techName.charAt(0).toUpperCase();
  const isPast =
    booking.bookingDate &&
    new Date(booking.bookingDate) < new Date(new Date().toDateString());
  const canCancel = ["PENDING", "ACCEPTED"].includes(booking.status as string);
  const canPay = booking.status === "ACCEPTED";

  return (
    <li className="rounded-xl border bg-card p-4 sm:p-5 hover:shadow-md hover:border-primary/40 transition-all">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {booking.technician?.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.technician.profileImage}
              alt={techName}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-semibold flex items-center justify-center">
              {techInitial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold tracking-tight truncate">
                {booking.service?.title ?? "Service"}
              </h3>
              <StatusBadge status={booking.status} />
              {booking.payment?.status ? (
                <PaymentBadge status={booking.payment.status} />
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              #{booking.id.slice(-8)} • {techName}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatBookingDate(booking.bookingDate)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {booking.startTime} – {booking.endTime}
              </span>
              {booking.customerAddress ? (
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5" />
                  {booking.customerAddress}
                </span>
              ) : null}
            </div>
            {isPast && booking.status === "COMPLETED" ? (
              <div className="mt-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/services/${booking.service?.id ?? ""}/review`}>
                    <Star className="h-3.5 w-3.5" />
                    Leave a review
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-lg font-bold">
            {formatBDT(booking.totalAmount)}
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            {canPay ? (
              <Button
                size="sm"
                variant="gradient"
                onClick={onPay}
                disabled={paying || cancelling}
              >
                {paying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Pay now
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={cancelling || paying}
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<
    string,
    { variant: any; icon: any; label: string }
  > = {
    PENDING: { variant: "warning", icon: Clock, label: "Pending" },
    ACCEPTED: { variant: "info", icon: CheckCircle2, label: "Accepted" },
    PAID: { variant: "info", icon: CreditCard, label: "Paid" },
    IN_PROGRESS: { variant: "info", icon: Loader2, label: "In Progress" },
    COMPLETED: { variant: "success", icon: CheckCircle2, label: "Completed" },
    DECLINED: { variant: "destructive", icon: XCircle, label: "Declined" },
    CANCELLED: { variant: "destructive", icon: XCircle, label: "Cancelled" },
  };
  const cfg = map[status] ?? {
    variant: "secondary",
    icon: Clock,
    label: status,
  };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function PaymentBadge({
  status,
}: {
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
}) {
  const map: Record<
    string,
    { variant: any; icon: any; label: string }
  > = {
    PAID: { variant: "success", icon: CreditCard, label: "Paid" },
    PENDING: { variant: "warning", icon: Clock, label: "Pay pending" },
    FAILED: { variant: "destructive", icon: XCircle, label: "Pay failed" },
    REFUNDED: { variant: "secondary", icon: RefreshCw, label: "Refunded" },
  };
  const cfg = map[status] ?? {
    variant: "secondary",
    icon: CreditCard,
    label: status,
  };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function formatBookingDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  if (!y || !m || !d) return yyyyMmDd;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
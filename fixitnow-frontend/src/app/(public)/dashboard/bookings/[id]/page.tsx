"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Receipt,
  Star,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { cn, formatBDT, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApiSuccess, BookingStatus } from "@/types";

interface BookingDetail {
  id: string;
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
  endTime: string;
  hourlyRate?: number | string;
  totalAmount: number | string;
  customerAddress?: string | null;
  createdAt: string;
  technician?: {
    id: string;
    bio?: string;
    yearsOfExperience?: number;
    averageRating?: number;
    totalReviews?: number;
    user?: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      profileImage?: string | null;
    };
  };
  service?: {
    id: string;
    title: string;
    description?: string;
    hourlyRate: number | string;
    location?: string;
    category?: { id: string; name: string };
  };
  payment?: {
    id: string;
    amount?: number | string;
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "SUCCEEDED";
    paymentMethod?: string | null;
    currency?: string;
    stripePaymentIntentId?: string | null;
    paidAt?: string | null;
    createdAt?: string;
  };
  review?: { id: string; rating: number; comment?: string };
}

const STATUS_META: Record<
  BookingStatus,
  { label: string; variant: "default" | "info" | "success" | "warning" | "destructive" | "secondary"; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { label: "Pending", variant: "warning", icon: Clock },
  ACCEPTED: { label: "Accepted", variant: "info", icon: CheckCircle2 },
  PAID: { label: "Paid", variant: "info", icon: CreditCard },
  COMPLETED: { label: "Completed", variant: "success", icon: CalendarCheck2 },
  DECLINED: { label: "Declined", variant: "destructive", icon: XCircle },
  CANCELLED: { label: "Cancelled", variant: "secondary", icon: XCircle },
};

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<BookingDetail>
  >({
    queryKey: ["booking-detail", id],
    queryFn: async () => (await api.get(`/bookings/${id}`)).data,
    enabled: Boolean(id),
    staleTime: 15_000,
  });

  const booking = (data?.data ?? null) as BookingDetail | null;

  const cancelMutation = useMutation({
    mutationFn: async (payload: { id: string; reason?: string }) =>
      (await api.patch(`/bookings/${payload.id}/cancel`, { reason: payload.reason })).data,
    onSuccess: () => {
      toast.success("Booking cancelled");
      setCancelOpen(false);
      setCancelReason("");
      qc.invalidateQueries({ queryKey: ["booking-detail", id] });
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Couldn't cancel booking"
      );
    },
  });

  const canCancel =
    booking && (booking.status === "PENDING" || booking.status === "ACCEPTED");

  const canReview =
    booking &&
    booking.status === "COMPLETED" &&
    !booking.review &&
    me?.role === "CUSTOMER";

  const canPay = booking && booking.status === "ACCEPTED" && !booking.payment;

  if (isLoading) {
    return (
      <div className="py-8 md:py-12 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="py-8 md:py-12 max-w-4xl mx-auto">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/bookings">
            <ArrowLeft className="h-4 w-4" />
            Back to bookings
          </Link>
        </Button>
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">
                {"Couldn\u2019t load this booking"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {(error as any)?.response?.data?.message ||
                  (error as any)?.message ||
                  "It may have been deleted, or you don\u2019t have access."}
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

  const statusMeta = STATUS_META[booking.status] || STATUS_META.PENDING;
  const StatusIcon = statusMeta.icon;

  const techName = booking.technician?.user?.name ?? "Technician";

  // Duration: derive from start/end "HH:mm" strings when present
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  let durationLabel = "—";
  if (booking.startTime && booking.endTime) {
    const diff = toMin(booking.endTime) - toMin(booking.startTime);
    if (diff > 0) {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      durationLabel =
        mins === 0
          ? `${hours} hour${hours === 1 ? "" : "s"}`
          : `${hours}h ${mins}m`;
    }
  }

  return (
    <div className="py-8 md:py-12 max-w-4xl mx-auto">
      <div className="text-xs text-muted-foreground mb-3">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/dashboard/bookings" className="hover:text-foreground transition-colors">
          Bookings
        </Link>
        <span className="mx-1.5">/</span>
        <span className="font-mono">{booking.id.slice(0, 8)}</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Calendar className="h-3.5 w-3.5" />
            Booking detail
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            {booking.service?.title || "Booking"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatDate(booking.createdAt)}
          </p>
        </div>
        <Badge variant={statusMeta.variant} className="inline-flex items-center gap-1.5 text-sm px-3 py-1">
          <StatusIcon className="h-4 w-4" />
          {statusMeta.label}
        </Badge>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule */}
          <section className="card-premium card-halo p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Schedule
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(booking.bookingDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium">
                  {booking.startTime} – {booking.endTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{durationLabel}</p>
              </div>
            </div>
          </section>

          {/* Service */}
          {booking.service ? (
            <section className="card-premium card-halo p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Service
              </h2>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/services/${booking.service.id}`}
                    className="text-lg font-medium hover:underline"
                  >
                    {booking.service.title}
                  </Link>
                  {booking.service.description ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.service.description}
                    </p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Hourly rate</p>
                  <p className="font-semibold">
                    {formatBDT(Number(booking.service.hourlyRate))}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Address */}
          {booking.customerAddress ? (
            <section className="card-premium card-halo p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Service address
              </h2>
              <p className="text-sm">{booking.customerAddress}</p>
            </section>
          ) : null}

          {/* Review state */}
          {booking.review ? (
            <section className="card-premium card-halo p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                Your review
              </h2>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "h-4 w-4",
                      n <= booking.review!.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              {booking.review.comment ? (
                <p className="text-sm whitespace-pre-wrap">
                  {booking.review.comment}
                </p>
              ) : null}
              <div className="mt-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/reviews">Manage reviews</Link>
                </Button>
              </div>
            </section>
          ) : null}
        </div>

        {/* Right rail */}
        <aside className="space-y-6">
          {/* Payment summary */}
          <section className="card-premium card-halo p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Payment
            </h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-lg">
                {formatBDT(Number(booking.totalAmount))}
              </span>
            </div>
            {booking.payment ? (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    booking.payment.status === "PAID"
                      ? "success"
                      : booking.payment.status === "FAILED"
                      ? "destructive"
                      : "warning"
                  }
                >
                  {booking.payment.status}
                </Badge>
              </div>
            ) : (
              <div className="mt-3 text-xs text-muted-foreground">
                No payment recorded yet.
              </div>
            )}
            {booking.payment ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                asChild
              >
                <Link href={`/dashboard/payments/${booking.payment.id}`}>
                  View payment
                </Link>
              </Button>
            ) : null}
          </section>

          {/* Technician */}
          {booking.technician?.user ? (
            <section className="card-premium card-halo p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Technician
              </h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-bold overflow-hidden shrink-0">
                  {booking.technician.user.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={booking.technician.user.profileImage}
                      alt={techName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    techName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{techName}</p>
                  {booking.technician.yearsOfExperience ? (
                    <p className="text-xs text-muted-foreground">
                      {booking.technician.yearsOfExperience}+ years experience
                    </p>
                  ) : null}
                </div>
              </div>
              {booking.technician.user.email ? (
                <p className="text-xs text-muted-foreground">
                  {booking.technician.user.email}
                </p>
              ) : null}
              {booking.technician.user.phone ? (
                <p className="text-xs text-muted-foreground">
                  {booking.technician.user.phone}
                </p>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                asChild
              >
                <Link href={`/technicians/${booking.technician.id}`}>
                  View profile
                </Link>
              </Button>
            </section>
          ) : null}

          {/* Actions */}
          <section className="card-premium card-halo p-5 space-y-2">
            <h2 className="font-semibold mb-1">Actions</h2>
            {canCancel ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="h-4 w-4" />
                Cancel booking
              </Button>
            ) : null}
            {canReview ? (
              <Button
                variant="gradient"
                className="w-full"
                asChild
              >
                <Link
                  href={`/dashboard/reviews/new?bookingId=${booking.id}`}
                >
                  <Star className="h-4 w-4" />
                  Write a review
                </Link>
              </Button>
            ) : null}
            {canPay ? (
              <Button variant="gradient" className="w-full" asChild>
                <Link href={`/payment?bookingId=${booking.id}`}>
                  <CreditCard className="h-4 w-4" />
                  Pay now
                </Link>
              </Button>
            ) : null}
            <Button variant="ghost" className="w-full" onClick={() => refetch()}>
              Refresh
            </Button>
          </section>
        </aside>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              The technician will be notified. This action can{"\u2019"}t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCancelReason(e.target.value)
              }
              placeholder="Briefly tell us why…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCancelOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Keep booking
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancelMutation.mutate({
                  id: booking.id,
                  reason: cancelReason.trim() || undefined,
                })
              }
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Cancel booking
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  Wrench,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess, Service } from "@/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Backend may serialize Availability.date as either an ISO string ("2025-11-22")
// or a Date object — normalize to a plain YYYY-MM-DD key so the day-by-day
// grouping matches the booking page's keys.
const normalizeSlotDate = (value: unknown): string => {
  if (!value) return "unknown";
  if (typeof value === "string") {
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
  if (value instanceof Date) return toDateKey(value);
  return String(value);
};

export default function ServiceDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const {
    data: res,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ApiSuccess<Service>>({
    queryKey: ["service", id],
    queryFn: async () => {
      const r = await api.get(`/services/${id}`);
      return r.data;
    },
    enabled: Boolean(id),
  });

  const service = res?.data;
  const tech = service?.technician as
    | (NonNullable<Service["technician"]> & { user?: { name?: string; email?: string; profileImage?: string } })
    | undefined;
  const techName = (tech as any)?.user?.name ?? (tech as any)?.name ?? "Technician";
  const techInitial = techName.charAt(0).toUpperCase();
  const category = service?.category;
  const reviews = service?.reviews ?? [];
  const availabilities = (service as any)?.availabilities ?? (tech as any)?.avalability ?? [];

  const rating = service?.averageRating ?? 0;
  const reviewsCount = service?.totalReviews ?? reviews.length;
  const hasRating = rating > 0;

  // Group availability slots by date for cleaner rendering
  const slotsByDate = useMemo(() => {
    const map = new Map<string, typeof availabilities>();
    for (const slot of availabilities) {
      const key = normalizeSlotDate(slot?.date);
      const arr = map.get(key) ?? [];
      arr.push(slot);
      map.set(key, arr);
    }
    return Array.from(map.entries()).slice(0, 5);
  }, [availabilities]);

  // CTA: every visitor goes to the same /book route.
  //   • Signed-in CUSTOMERs see the booking form immediately.
  //   • Guests are redirected to /login?next=… by the booking page.
  //   • Non-customer roles (technician/admin) are sent to /dashboard.
  // This keeps the CTA label constant and removes the redundant "Login to
  // book" toggle that used to live here.
  const bookHref = useMemo(() => `/services/${id}/book`, [id]);
  const ctaLabel = "Book this service";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <section className="container py-6">
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Link>
      </section>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !service ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
      ) : (
        <main className="container pb-16 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left column: hero + description + technician + reviews */}
          <div className="space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border bg-card overflow-hidden"
            >
              <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary/20 via-cyan-400/20 to-sky-400/20">
                <div className="absolute inset-0 flex items-center justify-center text-primary/40">
                  <Wrench className="h-20 w-20" />
                </div>
                {category?.name ? (
                  <Badge className="absolute top-4 left-4" variant="info">
                    {category.name}
                  </Badge>
                ) : null}
                {hasRating && rating >= 4.5 ? (
                  <Badge className="absolute top-4 right-4" variant="success">
                    Top Rated
                  </Badge>
                ) : null}
              </div>

              <div className="p-6 space-y-4">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {service.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1">
                    <Star
                      className={cn(
                        "h-4 w-4",
                        hasRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="font-semibold text-foreground">
                      {hasRating ? rating.toFixed(1) : "New"}
                    </span>
                    <span className="text-muted-foreground">
                      ({reviewsCount} review{reviewsCount === 1 ? "" : "s"})
                    </span>
                  </div>

                  {service.location ? (
                    <div className="inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{service.location}</span>
                    </div>
                  ) : null}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-base font-semibold mb-2">About this service</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {service.description}
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Technician */}
            {tech ? (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-2xl border bg-card p-6"
              >
                <h2 className="text-lg font-semibold mb-4">Your technician</h2>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-xl font-bold shrink-0">
                    {techInitial}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="font-semibold">{techName}</p>
                      {(tech as any)?.bio ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          {(tech as any).bio}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {(tech as any)?.yearsOfExperience ? (
                        <span>
                          {(tech as any).yearsOfExperience}+ years experience
                        </span>
                      ) : null}
                      {(tech as any)?.user?.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {(tech as any).user.email}
                        </span>
                      ) : null}
                      {(tech as any)?.user?.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {(tech as any).user.phone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : null}

            {/* Reviews */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Reviews</h2>
                <span className="text-xs text-muted-foreground">
                  {reviewsCount} total
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No reviews yet. Be the first to book and review this service.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((r) => (
                    <li
                      key={r.id}
                      className="border-b last:border-b-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-semibold shrink-0">
                          {r.customer?.name?.charAt(0).toUpperCase() ?? "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm">
                              {r.customer?.name ?? "Anonymous"}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {r.createdAt ? formatDate(r.createdAt) : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  i < (r.rating ?? 0)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/40"
                                )}
                              />
                            ))}
                          </div>
                          {r.comment ? (
                            <p className="text-sm text-muted-foreground mt-2">
                              {r.comment}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          </div>

          {/* Right column: booking sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-2xl border bg-card p-6 space-y-4"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Hourly rate
                </p>
                <div className="mt-2 inline-flex items-baseline gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5">
                  <span className="text-2xl font-bold text-primary leading-none">
                    {formatBDT(service.hourlyRate)}
                  </span>
                  <span className="text-sm font-medium text-primary/70 leading-none">
                    /hr
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Available slots
                </p>

                {slotsByDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No upcoming availability. Contact the technician to schedule.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {slotsByDate.map(([date, slots]) => (
                      <li key={date}>
                        <p className="text-xs text-muted-foreground mb-1.5">
                          {date !== "unknown" ? formatDate(date) : "TBD"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {slots.map((s: any) => (
                            <Badge
                              key={s.id}
                              variant="outline"
                              className="font-mono text-[11px]"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {s.startTime} – {s.endTime}
                            </Badge>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button asChild className="w-full" size="lg">
                <Link href={bookHref}>{ctaLabel}</Link>
              </Button>

              {!isCustomer ? (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>
                    You will be redirected to login to confirm your booking.
                    New here?{" "}
                    <Link
                      href={`/register?next=/services/${service.id}/book`}
                      className="text-primary hover:underline"
                    >
                      Create an account
                    </Link>
                    .
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>
                    Pick a date and time on the next step to confirm your
                    booking.
                  </span>
                </div>
              )}
            </motion.div>
          </aside>
        </main>
      )}

      <PublicFooter />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className="container pb-16 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <div className="rounded-2xl border bg-card overflow-hidden">
          <Skeleton className="h-48 sm:h-56 w-full rounded-none" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </aside>
    </main>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <main className="container pb-16">
      <div className="max-w-md mx-auto rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-lg font-semibold text-destructive">
          Couldn&apos;t load this service
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {message || "The service may be unavailable or the link is invalid."}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/services">
              <ArrowLeft className="h-4 w-4" />
              Back to services
            </Link>
          </Button>
          <Button onClick={onRetry}>
            <Loader2 className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
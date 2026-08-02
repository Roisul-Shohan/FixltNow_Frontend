"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  Wrench,
  ShieldCheck,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ApiSuccess,
  AvailabilitySlot,
  Review,
  Service,
  TechnicianProfile,
} from "@/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

type TechnicianDetail = {
  technician: TechnicianProfile & {
    service?: Array<Service & { category?: { id: string; name: string } }>;
    review?: Review[];
  };
  availability?: AvailabilitySlot[];
};

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Backend may serialize Availability.date as either an ISO string
// ("2025-11-22") or a Date object — normalize to YYYY-MM-DD so the
// day-by-day grouping matches the booking page's keys.
const normalizeSlotDate = (value: unknown): string => {
  if (!value) return "unknown";
  if (typeof value === "string") {
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
  if (value instanceof Date) return toDateKey(value);
  return String(value);
};

export default function TechnicianDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const {
    data: res,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ApiSuccess<TechnicianDetail>>({
    queryKey: ["technician", id],
    queryFn: async () => {
      const r = await api.get(`/technicians/${id}`);
      return r.data;
    },
    enabled: Boolean(id),
  });

  // Defensive unwrap: backend wraps the payload in ApiSuccess<T>, so
  // r.data looks like `{ success, statusCode, message, data: { technician,
  // availability } }`. Some legacy endpoints may strip the wrapper and
  // return the detail directly — handle both shapes.
  const raw = res?.data as unknown;
  const detail: TechnicianDetail | undefined =
    raw && typeof raw === "object" && "technician" in (raw as any)
      ? (raw as TechnicianDetail)
      : raw && typeof raw === "object" && "data" in (raw as any) && (raw as any).data?.technician
      ? ((raw as any).data as TechnicianDetail)
      : undefined;

  const tech = detail?.technician;
  const user = tech?.user;
  const name = user?.name ?? "Technician";
  const firstName = name.split(" ")[0] || name;
  const initial = name.charAt(0).toUpperCase();
  const avatar = user?.profileImage;

  const services = tech?.service ?? [];
  const reviews: Review[] = (tech?.review as Review[] | undefined) ?? [];
  const availability: AvailabilitySlot[] = detail?.availability ?? [];

  const rating = tech?.averageRating ?? 0;
  const totalReviews = tech?.totalReviews ?? reviews.length;
  const hasRating = rating > 0;
  const years = tech?.yearsOfExperience ?? 0;
  const bio = tech?.bio ?? "";

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      if (s.category?.name) set.add(s.category.name);
    }
    return Array.from(set);
  }, [services]);

  // Group availability slots by date for cleaner rendering
  const slotsByDate = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const slot of availability) {
      const key = normalizeSlotDate(slot?.date);
      const arr = map.get(key) ?? [];
      arr.push(slot);
      map.set(key, arr);
    }
    return Array.from(map.entries()).slice(0, 5);
  }, [availability]);

  // Role-aware CTAs: the technician who owns this profile gets a
  // "Manage in dashboard" button instead of booking links.
  const authUser = useAuthStore((s) => s.user);
  const isOwner =
    authUser?.role === "TECHNICIAN" && (tech as any)?.user?.id === authUser?.id;
  const hasContact = Boolean(user?.email || user?.phone);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <section className="container py-6">
        <Link
          href="/technicians"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to technicians
        </Link>
      </section>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !tech ? (
        <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
      ) : (
        <main className="container pb-16">
          {/* Hero card — full width, sits above the two-column layout */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border bg-card overflow-hidden"
          >
            <div className="relative h-44 sm:h-52 bg-gradient-to-br from-primary/20 via-cyan-400/20 to-sky-400/20">
              <div className="absolute inset-0 flex items-center justify-center text-primary/40">
                <Wrench className="h-16 w-16" />
              </div>
              {categories[0] ? (
                <Badge className="absolute top-4 left-4" variant="info">
                  {categories[0]}
                </Badge>
              ) : null}
              {hasRating && rating >= 4.5 ? (
                <Badge className="absolute top-4 right-4" variant="success">
                  Top Rated
                </Badge>
              ) : null}
            </div>

            <div className="p-6 sm:p-8 flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-2xl font-bold ring-4 ring-background -mt-14 sm:-mt-16">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {name}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Verified FixItNow technician
                    {years > 0 ? (
                      <>
                        <span aria-hidden>·</span>
                        <Briefcase className="h-3.5 w-3.5" />
                        {years}+ years experience
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                      ({totalReviews} review{totalReviews === 1 ? "" : "s"})
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                    <Wrench className="h-3.5 w-3.5" />
                    <span>
                      {services.length} service{services.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {categories.length > 0 ? (
                    <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{categories.join(", ")}</span>
                    </div>
                  ) : null}
                </div>

                {bio ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {bio}
                  </p>
                ) : null}
              </div>
            </div>
          </motion.section>

          {/* Two-column layout: services + reviews on the left,
              action sidebar on the right */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Left column: services + reviews as looser, less blocky cards */}
            <div className="space-y-10">
              {/* Services */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
              >
                <header className="mb-4 flex items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">Services offered</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pick what you need and book {firstName} in minutes.
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {services.length} total
                  </span>
                </header>

                {services.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {firstName} hasn&apos;t published any services yet.
                    </p>
                  </div>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {services.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/services/${s.id}`}
                          className="group flex h-full flex-col gap-3 rounded-xl border bg-background p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                {s.title}
                              </p>
                              {s.category?.name ? (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {s.category.name}
                                </p>
                              ) : null}
                              {s.location ? (
                                <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {s.location}
                                </p>
                              ) : null}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </div>

                          <div className="mt-auto flex items-center justify-between">
                            <span className="inline-flex items-baseline gap-1 rounded-md bg-primary/10 px-2 py-1">
                              <span className="text-sm font-bold text-primary leading-none">
                                {formatBDT(s.hourlyRate)}
                              </span>
                              <span className="text-[10px] font-medium text-primary/70 leading-none">
                                /hr
                              </span>
                            </span>
                            {(s.averageRating ?? 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {(s.averageRating ?? 0).toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.section>

              {/* Reviews */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <header className="mb-4 flex items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">Reviews</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      What customers say after working with {firstName}.
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {totalReviews} total
                  </span>
                </header>

                {reviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No reviews yet. Be the first to book and review{" "}
                      {firstName}.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {reviews.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-xl border bg-background p-4"
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
                              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
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

            {/* Right sidebar — action hub with multiple buttons */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-2xl border bg-card overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Get in touch
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reach out to {firstName} to schedule a booking or ask
                      about your job.
                    </p>
                  </div>

                  {/* Primary CTA — owner swaps to dashboard */}
                  {isOwner ? (
                    <Button asChild className="w-full" size="lg">
                      <Link href="/tech">
                        <Wrench className="h-4 w-4" />
                        Manage in dashboard
                      </Link>
                    </Button>
                  ) : services.length > 0 ? (
                    <Button asChild className="w-full" size="lg">
                      <Link href="/services">
                        <Calendar className="h-4 w-4" />
                        Book a service
                      </Link>
                    </Button>
                  ) : null}

                  {/* Secondary contact buttons */}
                  {hasContact ? <div className="border-t" /> : null}

                  <div className="flex flex-col gap-2">
                    {user?.email ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <a href={`mailto:${user.email}`}>
                          <Mail className="h-4 w-4" />
                          <span className="truncate">Email {firstName}</span>
                        </a>
                      </Button>
                    ) : null}

                    {user?.phone ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <a href={`tel:${user.phone}`}>
                          <Phone className="h-4 w-4" />
                          <span className="truncate">Call {user.phone}</span>
                        </a>
                      </Button>
                    ) : null}

                    {services.length > 0 ? (
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <Link href="/services">
                          <Wrench className="h-4 w-4" />
                          Browse all services
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="border-t" />

                <div className="p-5 space-y-3">
                  <p className="text-sm font-semibold inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Available slots
                  </p>

                  {slotsByDate.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming availability. Contact {firstName} to
                      schedule.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {slotsByDate.map(([date, slots]) => (
                        <li key={date}>
                          <p className="text-xs text-muted-foreground mb-1.5">
                            {date !== "unknown" ? formatDate(date) : "TBD"}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {slots.map((s) => (
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

                <div className="border-t" />

                <div className="p-5 flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>
                    To book a service, open any of {firstName}&apos;s services
                    and pick a slot. You will be redirected to login to
                    confirm your booking.
                  </span>
                </div>
              </motion.div>
            </aside>
          </div>
        </main>
      )}

      <PublicFooter />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className="container pb-16">
      <div className="rounded-2xl border bg-card overflow-hidden">
        <Skeleton className="h-44 sm:h-52 w-full rounded-none" />
        <div className="p-6 sm:p-8 flex items-start gap-5">
          <Skeleton className="h-20 w-20 rounded-full -mt-14" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
        <aside>
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </aside>
      </div>
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
          Couldn&apos;t load this technician
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {message || "The technician may be unavailable or the link is invalid."}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/technicians">
              <ArrowLeft className="h-4 w-4" />
              Back to technicians
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

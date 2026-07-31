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
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT, formatDate } from "@/lib/utils";
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

  const detail = res?.data;
  const tech = detail?.technician;
  const user = tech?.user;
  const name = user?.name ?? "Technician";
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
      const key = slot?.date ?? "unknown";
      const arr = map.get(key) ?? [];
      arr.push(slot);
      map.set(key, arr);
    }
    return Array.from(map.entries()).slice(0, 5);
  }, [availability]);

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
        <main className="container pb-16 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left column: hero + services + reviews */}
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

              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-2xl font-bold">
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
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      {name}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Professional technician
                      {years > 0 ? <> &middot; {years}+ years experience</> : null}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
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

                      <div className="inline-flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{services.length} service{services.length === 1 ? "" : "s"}</span>
                      </div>

                      {categories.length > 0 ? (
                        <div className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{categories.join(", ")}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {bio ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-4">
                    <h3 className="text-base font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{bio}</p>
                  </div>
                ) : null}

                {(user?.email || user?.phone) ? (
                  <div className="border-t pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    {user?.email ? (
                      <a
                        href={`mailto:${user.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </a>
                    ) : null}
                    {user?.phone ? (
                      <a
                        href={`tel:${user.phone}`}
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{user.phone}</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </motion.section>

            {/* Services */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-2xl border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Services offered</h2>
                <span className="text-xs text-muted-foreground">
                  {services.length} total
                </span>
              </div>

              {services.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    This technician hasn&apos;t published any services yet.
                  </p>
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/services/${s.id}`}
                        className="group block h-full rounded-xl border bg-background p-4 transition-all hover:border-primary/40 hover:shadow-sm"
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
                        <div className="mt-3 flex items-center justify-between">
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
              className="rounded-2xl border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Reviews</h2>
                <span className="text-xs text-muted-foreground">
                  {totalReviews} total
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No reviews yet. Be the first to book and review this technician.
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

          {/* Right column: contact + availability */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-2xl border bg-card p-6 space-y-4"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Get in touch
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Reach out to {name.split(" ")[0]} to schedule a booking or ask
                  about your job.
                </p>
              </div>

              {user?.email ? (
                <Button asChild className="w-full" size="lg">
                  <a href={`mailto:${user.email}`}>
                    <Mail className="h-4 w-4" />
                    Email {name.split(" ")[0]}
                  </a>
                </Button>
              ) : null}

              {user?.phone ? (
                <Button asChild className="w-full" size="lg" variant="outline">
                  <a href={`tel:${user.phone}`}>
                    <Phone className="h-4 w-4" />
                    Call {user.phone}
                  </a>
                </Button>
              ) : null}

              {services.length > 0 ? (
                <Button asChild className="w-full" variant="outline">
                  <Link href="/services">
                    <Wrench className="h-4 w-4" />
                    Browse all services
                  </Link>
                </Button>
              ) : null}

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

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span>
                  To book a service, open any of {name.split(" ")[0]}&apos;s
                  services and pick a slot. You will be redirected to login to
                  confirm your booking.
                </span>
              </div>
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
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
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
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
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

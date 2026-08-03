"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  CalendarCheck2,
  Loader2,
  MessageSquare,
  RefreshCw,
  Star,
  StarOff,
  User as UserIcon,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ----------------------- Types ----------------------- */

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}

interface ReviewCustomer {
  id: string;
  name: string;
  profileImage?: string | null;
}

interface ReviewService {
  id: string;
  title: string;
}

interface ReviewBooking {
  id: string;
  bookingDate: string;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  customer?: ReviewCustomer;
  service?: ReviewService;
  booking?: ReviewBooking;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface ReviewsPayload {
  reviews: ReviewRow[];
  stats: ReviewStats;
  meta?: { page: number; limit: number; total: number };
}

type FilterKey = "all" | "5" | "4" | "3" | "2" | "1";

/* ----------------------- Page ----------------------- */

export default function TechnicianReviewsPage() {
  const [filter, setFilter] = useState<FilterKey>("all");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<ApiSuccess<ReviewsPayload>>({
    queryKey: ["tech-reviews"],
    queryFn: async () => (await api.get("/technicians/me/reviews")).data,
    staleTime: 30_000,
  });

  const payload = data?.data;
  const reviews = useMemo<ReviewRow[]>(
    () => payload?.reviews ?? [],
    [payload?.reviews]
  );

  const stats = payload?.stats ?? {
    averageRating: 0,
    totalReviews: reviews.length,
  };

  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 5★, 4 = 4★...
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
    });
    return counts;
  }, [reviews]);

  const filtered = useMemo(() => {
    if (filter === "all") return reviews;
    const want = Number(filter);
    return reviews.filter((r) => r.rating === want);
  }, [reviews, filter]);

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
              <Star className="h-3.5 w-3.5 fill-primary" />
              Reviews
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl md:text-5xl font-bold tracking-tight"
            >
              What customers{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                are saying
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="max-w-xl text-sm md:text-base text-muted-foreground"
            >
              Ratings and comments from completed bookings.
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

      {/* Aggregate */}
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card p-6 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold tracking-tight">
            {stats.averageRating.toFixed(1)}
          </div>
          <Stars value={stats.averageRating} className="mt-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            from {stats.totalReviews} review
            {stats.totalReviews === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Rating breakdown</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : stats.totalReviews === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No reviews yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star - 1] ?? 0;
                const pct = (count / stats.totalReviews) * 100;
                return (
                  <li
                    key={star}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="w-8 shrink-0 text-muted-foreground">
                      {star}★
                    </span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Filter */}
      <section className="mb-4 flex items-center gap-2 overflow-x-auto">
        {(
          [
            { key: "all", label: "All" },
            { key: "5", label: "5★" },
            { key: "4", label: "4★" },
            { key: "3", label: "3★" },
            { key: "2", label: "2★" },
            { key: "1", label: "1★" },
          ] as { key: FilterKey; label: string }[]
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === opt.key
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </section>

      {/* List */}
      <section>
        {isLoading ? (
          <SkeletonList />
        ) : isError ? (
          <ErrorPanel
            message={
              (error as any)?.response?.data?.message ||
              (error as any)?.message ||
              "Failed to load reviews"
            }
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <Empty hasAny={reviews.length > 0} />
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ----------------------- Components ----------------------- */

function Stars({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) =>
        i < rounded ? (
          <Star
            key={i}
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
          />
        ) : (
          <StarOff key={i} className="h-4 w-4 text-muted-foreground/30" />
        )
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewRow }) {
  const customerName = review.customer?.name ?? "Customer";
  const initial = customerName.charAt(0).toUpperCase();
  const date = new Date(review.createdAt);

  return (
    <motion.li
      layout
      className="rounded-2xl border bg-card p-5 hover:shadow-md hover:border-primary/40 transition-all"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {review.customer?.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.customer.profileImage}
              alt={customerName}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-semibold flex items-center justify-center">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold tracking-tight truncate">
                {customerName}
              </h3>
              <Stars value={review.rating} />
            </div>
            <p className="text-xs text-muted-foreground">
              <UserIcon className="inline h-3 w-3 mr-1" />
              Customer
              {review.service?.title ? (
                <>
                  {" "}
                  for{" "}
                  <span className="font-medium text-foreground">
                    {review.service.title}
                  </span>
                </>
              ) : null}
            </p>
            {review.comment ? (
              <p className="mt-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <MessageSquare className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                {review.comment}
              </p>
            ) : (
              <p className="mt-2 italic text-xs text-muted-foreground">
                No comment.
              </p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <Badge variant="secondary" className="text-[10px]">
            {date.toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Badge>
        </div>
      </div>
    </motion.li>
  );
}

function Empty({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Star className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">
        {hasAny ? "No reviews match" : "No reviews yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasAny
          ? "Try a different rating filter."
          : "Reviews appear after customers rate completed bookings."}
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border bg-card p-5 animate-pulse h-28"
        />
      ))}
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
      <p className="font-semibold text-destructive">Couldn&apos;t load reviews</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-3">
        Try again
      </Button>
    </div>
  );
}
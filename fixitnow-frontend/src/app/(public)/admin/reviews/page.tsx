"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  Filter,
  Inbox,
  Mail,
  MessageSquare,
  Search,
  Star,
  User as UserIcon,
  Wrench,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, safeFormatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}

interface ReviewUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
}

interface ReviewService {
  id: string;
  title: string;
}

interface ReviewTechnician {
  id: string;
  user?: ReviewUser;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  customer?: ReviewUser;
  service?: ReviewService;
  technician?: ReviewTechnician;
}

const RATING_FILTERS = [
  { key: "all", label: "All", min: 0, max: 5 },
  { key: "5", label: "5 ★", min: 5, max: 5 },
  { key: "4", label: "4 ★+", min: 4, max: 5 },
  { key: "3", label: "3 ★+", min: 3, max: 5 },
  { key: "low", label: "≤ 2 ★", min: 0, max: 2 },
] as const;

type RatingFilterKey = (typeof RATING_FILTERS)[number]["key"];

export default function AdminReviewsPage() {
  const [rating, setRating] = useState<RatingFilterKey>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiSuccess<ReviewRow[]>
  >({
    queryKey: ["admin-reviews", rating],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 100 };
      if (rating !== "all") params.rating = RATING_FILTERS.find(
        (r) => r.key === rating
      )!.min;
      const res = await api.get("/admin/reviews", { params });
      return res.data;
    },
    staleTime: 15_000,
  });

  const raw: ReviewRow[] = useMemo(() => {
    const d: any = (data as any)?.data;
    if (Array.isArray(d)) return d as ReviewRow[];
    if (Array.isArray(d?.data)) return d.data as ReviewRow[];
    return [];
  }, [data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((r) => {
      return (
        r.comment?.toLowerCase().includes(q) ||
        r.customer?.name?.toLowerCase().includes(q) ||
        r.customer?.email?.toLowerCase().includes(q) ||
        r.service?.title?.toLowerCase().includes(q) ||
        r.technician?.user?.name?.toLowerCase().includes(q)
      );
    });
  }, [raw, search]);

  const stats = useMemo(() => {
    const rated = raw.filter((r) => Number.isFinite(r.rating));
    const avg =
      rated.length > 0
        ? rated.reduce((acc, r) => acc + Number(r.rating), 0) / rated.length
        : 0;
    return {
      total: raw.length,
      avg,
      fiveStar: raw.filter((r) => r.rating === 5).length,
      belowThree: raw.filter((r) => r.rating > 0 && r.rating < 3).length,
    };
  }, [raw]);

  return (
    <div className="space-y-6">
      <Header
        total={stats.total}
        avg={stats.avg}
        fiveStar={stats.fiveStar}
        belowThree={stats.belowThree}
      />

      {/* Filters */}
      <section className="rounded-2xl border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filter reviews</h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {RATING_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRating(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                rating === f.key
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-background hover:bg-accent text-foreground/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by review comment, customer, technician, or service…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                Couldn&apos;t load platform reviews.
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
            {rows.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------- Pieces ---------- */

function Header({
  total,
  avg,
  fiveStar,
  belowThree,
}: {
  total: number;
  avg: number;
  fiveStar: number;
  belowThree: number;
}) {
  return (
    <header>
      <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
        <MessageSquare className="h-3.5 w-3.5" />
        Reviews
      </div>
      <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
        All platform reviews
      </h1>
      <p className="text-sm md:text-base text-muted-foreground mt-1 max-w-xl">
        Inspect every review left for completed bookings, watch for abuse,
        and keep the marketplace healthy.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <SummaryCard
          label="Total"
          value={total}
          icon={MessageSquare}
        />
        <SummaryCard
          label="Avg rating"
          value={avg ? `${avg.toFixed(1)} ★` : "—"}
          icon={Star}
        />
        <SummaryCard
          label="5-star"
          value={fiveStar}
          icon={Star}
        />
        <SummaryCard
          label="Below 3 ★"
          value={belowThree}
          icon={AlertCircle}
        />
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
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-semibold">No reviews match your filters</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Reviews will appear once customers finish completed bookings.
      </p>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < v
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewRow }) {
  const customerName = review.customer?.name ?? "Customer";
  const techName = review.technician?.user?.name ?? "Technician";
  const serviceTitle = review.service?.title ?? "Service";
  const initial = customerName.charAt(0).toUpperCase();
  const date = safeFormatDate(review.createdAt, "—", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <li className="rounded-xl border bg-card p-4 sm:p-5 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        {review.customer?.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.customer.profileImage}
            alt={customerName}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-bold flex items-center justify-center">
            {initial}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold truncate">{customerName}</h3>
              <Badge variant="secondary" className="font-medium shrink-0">
                <UserIcon className="h-3 w-3 mr-1" />
                Customer
              </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Stars value={review.rating} />
              <span className="text-xs font-semibold">
                {Number(review.rating).toFixed(1)}
              </span>
            </div>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {review.customer?.email ? (
              <span className="inline-flex items-center gap-1 truncate">
                <Mail className="h-3 w-3" />
                {review.customer.email}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date}
            </span>
          </div>

          {review.comment ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {review.comment}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-muted-foreground">
              No comment provided.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 truncate">
              <Wrench className="h-3 w-3" />
              {serviceTitle}
            </span>
            <span className="inline-flex items-center gap-1 truncate">
              <UserIcon className="h-3 w-3" />
              for {techName}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
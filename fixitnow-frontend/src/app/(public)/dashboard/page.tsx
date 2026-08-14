"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  LayoutDashboard,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
  Wrench,
  XCircle,
  ArrowRight,
  Plus,
  RefreshCw,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT, safeFormatDate } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { ServiceCard } from "@/components/services/service-card";
import type {
  ApiSuccess,
  Booking,
  Service,
  Review,
} from "@/types";

interface DashboardSummary {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  upcomingBookings: number;
}

interface DashboardSpending {
  total: number;
  thisMonth: number;
  lastMonth: number;
}

interface DashboardProfile {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  createdAt?: string;
}

interface DashboardPayload {
  profile: DashboardProfile;
  summary: DashboardSummary;
  bookingStatusBreakdown: Record<string, number>;
  spending: DashboardSpending;
  recentBookings: Booking[];
  upcomingBookings: Booking[];
  recentReviews: Array<
    Review & { service?: { id: string; title: string } }
  >;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const loadMe = useAuthStore((s) => s.loadMe);

  // Ensure auth-store has hydrated from localStorage /api/auth/me on mount.
  useEffect(() => {
    if (!initialized) {
      loadMe();
    }
  }, [initialized, loadMe]);

  // Guard: if not authenticated once auth has hydrated, push to /login.
  useEffect(() => {
    if (initialized && !user && typeof window !== "undefined") {
      router.replace("/login?next=/dashboard");
    }
  }, [initialized, user, router]);

  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiSuccess<DashboardPayload>
  >({
    queryKey: ["customer-dashboard"],
    queryFn: async () => (await api.get("/bookings/me/dashboard")).data,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  // Recommended services — small set, top-rated
  const { data: recommended } = useQuery<ApiSuccess<Service[]>>({
    queryKey: ["dashboard-recommended"],
    queryFn: async () =>
      (
        await api.get(
          "/services?sortBy=averageRating&sortOrder=desc&limit=6"
        )
      ).data,
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const payload = data?.data;
  const summary = payload?.summary;
  const spending = payload?.spending;
  const upcoming = payload?.upcomingBookings ?? [];
  const recent = payload?.recentBookings ?? [];
  const reviews = payload?.recentReviews ?? [];
  const recommendedServices = recommended?.data ?? [];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName =
    (user?.name || payload?.profile?.name || "").split(" ")[0] || "there";

  return (
    <div className="py-8 md:py-12">
      {/* Hero — mirrors the technician dashboard header pattern */}
      <section className="mb-10">
        <div className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-cyan-400/10 to-sky-400/5 px-6 py-10 md:px-10 md:py-14">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="hero-overlay absolute inset-0 -z-10" />
          <div className="relative flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Customer Dashboard
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl md:text-5xl font-bold tracking-tight"
            >
              {greeting},{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                {firstName}
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="max-w-xl text-sm md:text-base text-muted-foreground"
            >
              Here&apos;s a quick look at your bookings, spending, and what we
              think you might need next.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
            >
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" asChild>
                <Link href="/services">
                  <Wrench className="h-4 w-4" />
                  Browse services
                </Link>
              </Button>
              <Button variant="gradient" asChild>
                <Link href="/services">
                  <Plus className="h-4 w-4" />
                  Book a service
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Soft banner — only for unexpected errors, not 404s */}
      {isError && !isEndpointMissing(error) ? (
        <div className="mb-8 rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-destructive">
              Couldn&apos;t load your dashboard.
            </p>
            <p className="text-muted-foreground mt-1">
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "Please check your connection and try again."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {isError && isEndpointMissing(error) ? (
        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-300">
              Dashboard metrics unavailable.
            </p>
            <p className="text-muted-foreground mt-1">
              The backend isn&apos;t serving <code>/bookings/me/dashboard</code> yet.
              Numbers below will be empty until it&apos;s deployed.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {/* Stat tiles */}
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {isLoading || !summary
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : (
            <>
              <StatTile
                label="Total bookings"
                value={summary.totalBookings}
                icon={Calendar}
                accent="from-primary/15 to-cyan-400/10"
              />
              <StatTile
                label="Upcoming"
                value={summary.upcomingBookings}
                icon={CalendarClock}
                accent="from-sky-500/15 to-blue-500/10"
              />
              <StatTile
                label="Completed"
                value={summary.completedBookings}
                icon={CheckCircle2}
                accent="from-emerald-500/15 to-green-500/10"
              />
              <StatTile
                label="Spent (lifetime)"
                value={formatBDT(spending?.total ?? 0)}
                icon={CreditCard}
                accent="from-amber-500/15 to-orange-500/10"
                text
              />
            </>
          )}
      </section>

      {/* Spending snapshot card */}
      <section className="mb-8">
        <SpendingCard
          loading={isLoading}
          spending={spending}
          thisMonthCount={summary?.pendingBookings ?? 0}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming bookings */}
        <section className="lg:col-span-2 card-premium card-halo p-5 sm:p-6">
          <SectionHeader
            icon={CalendarClock}
            title="Upcoming bookings"
            subtitle="Jobs scheduled in the next 7 days"
            right={
              <Link
                href="/services"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Book another
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />

          {isLoading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyMini
              title="No upcoming bookings"
              description="Browse our verified technicians and book a job in seconds."
              ctaHref="/services"
              ctaLabel="Find a technician"
            />
          ) : (
            <ul className="mt-5 space-y-3">
              {upcoming.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </ul>
          )}
        </section>

        {/* Recent reviews */}
        <section className="card-premium card-halo p-5 sm:p-6">
          <SectionHeader
            icon={MessageSquare}
            title="Recent reviews"
            subtitle="What you&apos;ve said lately"
          />

          {isLoading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyMini
              title="No reviews yet"
              description="After a job wraps up, leave a rating to help other customers."
            />
          ) : (
            <ul className="mt-5 space-y-4">
              {reviews.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-start gap-3">
                  <Stars value={r.rating} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm line-clamp-2 text-foreground/90">
                      {r.comment || "No comment"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {r.service?.title ?? "Service"} •{" "}
                      {safeFormatDate(r.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent bookings table-style list */}
      <section className="mt-6 card-premium card-halo p-5 sm:p-6">
        <SectionHeader
          icon={Clock}
          title="Recent activity"
          subtitle="Your last few bookings"
          right={
            <Link
              href="/dashboard/bookings"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              See all
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />

        {isLoading ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyMini
            title="No activity yet"
            description="Your bookings will appear here as soon as you make one."
            ctaHref="/services"
            ctaLabel="Browse services"
          />
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2 pr-3">Service</th>
                  <th className="text-left py-2 pr-3">Technician</th>
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-right py-2 pl-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent.map((b) => (
                  <tr key={b.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3 pr-3 font-medium">
                      {b.service?.title ?? "Service"}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {(b.technician as any)?.user?.name ??
                        (b.technician as any)?.name ??
                        "—"}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">
                      {safeFormatDate(b.bookingDate)}
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {formatBDT(b.totalAmount)}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recommended services */}
      <section className="mt-10">
        <SectionHeader
          icon={Sparkles}
          title="Recommended for you"
          subtitle="Top-rated services from verified technicians"
          right={
            <Link
              href="/services"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              See all
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />

        {!recommended ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : recommendedServices.length === 0 ? (
          <EmptyMini
            title="Nothing to recommend yet"
            description="Once you book a service, we'll tailor picks to your needs."
          />
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recommendedServices.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
/* ---------- Pieces ---------- */

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
  text,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  text?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("stat-tile relative overflow-hidden rounded-xl p-4 sm:p-5")}
    >
      <div
        className={cn(
          "absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl bg-gradient-to-br opacity-80",
          accent
        )}
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div
        className={cn(
          "relative mt-3 font-bold tracking-tight",
          text ? "text-2xl" : "text-3xl"
        )}
      >
        {value}
      </div>
    </motion.div>
  );
}

function SpendingCard({
  loading,
  spending,
  thisMonthCount,
}: {
  loading: boolean;
  spending?: DashboardSpending;
  thisMonthCount: number;
}) {
  const total = spending?.total ?? 0;
  const thisMonth = spending?.thisMonth ?? 0;
  const lastMonth = spending?.lastMonth ?? 0;
  const trend =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  return (
    <div className="card-premium card-halo overflow-hidden p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white shadow-lg shadow-primary/30">
              <CreditCard className="h-4 w-4" />
            </span>
            <h3 className="font-semibold">Spending overview</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Track how much you&apos;ve spent on FixItNow services over time.
          </p>

          {loading ? (
            <Skeleton className="mt-4 h-10 w-48" />
          ) : (
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight">
                {formatBDT(total)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Lifetime across {thisMonthCount} pending job
                {thisMonthCount === 1 ? "" : "s"} and finished work
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <MiniSpend
            label="This month"
            value={formatBDT(thisMonth)}
            loading={loading}
          />
          <MiniSpend
            label="Last month"
            value={formatBDT(lastMonth)}
            loading={loading}
            trend={trend}
          />
        </div>
      </div>
    </div>
  );
}

function MiniSpend({
  label,
  value,
  loading,
  trend,
}: {
  label: string;
  value: string;
  loading: boolean;
  trend?: number;
}) {
  return (
    <div className="rounded-lg border bg-card/40 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-6 w-24" />
      ) : (
        <div className="mt-1 flex items-baseline gap-2">
          <div className="text-lg font-semibold">{value}</div>
          {typeof trend === "number" && trend !== 0 ? (
            <Badge
              variant={trend > 0 ? "warning" : "success"}
              className="text-[10px]"
            >
              {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%
            </Badge>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="font-semibold tracking-tight">{title}</h3>
        </div>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const tech = booking.technician as any;
  const techName = tech?.user?.name ?? tech?.name ?? "Technician";
  const initial = techName.charAt(0).toUpperCase();
  const dateStr = safeFormatDate(booking.bookingDate, "—", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card/40 p-3 hover:bg-accent/40 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white font-semibold">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">
          {booking.service?.title ?? "Service"}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {dateStr}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {booking.startTime && booking.endTime
              ? `${booking.startTime}–${booking.endTime}`
              : "—"}
          </span>
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3" /> by {techName}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-sm">
          {formatBDT(booking.totalAmount)}
        </div>
        <div className="mt-1">
          <StatusBadge status={booking.status} />
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: any; icon: any; label: string }> = {
    PENDING: { variant: "warning", icon: Clock, label: "Pending" },
    ACCEPTED: { variant: "info", icon: CheckCircle2, label: "Accepted" },
    PAID: { variant: "info", icon: CreditCard, label: "Paid" },
    COMPLETED: { variant: "success", icon: CheckCircle2, label: "Completed" },
    CANCELLED: { variant: "destructive", icon: XCircle, label: "Cancelled" },
    DECLINED: { variant: "destructive", icon: XCircle, label: "Declined" },
  };
  const cfg = map[status] ?? {
    variant: "secondary",
    icon: Loader2,
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

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < value ? "fill-current" : "text-muted-foreground/40"
          )}
        />
      ))}
    </div>
  );
}

function EmptyMini({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed bg-card/30 p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {ctaHref && ctaLabel ? (
        <Button asChild variant="outline" className="mt-4">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

/** True when the backend doesn't ship the dashboard endpoint (404 / 405). */
function isEndpointMissing(err: unknown) {
  const status = (err as any)?.response?.status;
  return status === 404 || status === 405;
}

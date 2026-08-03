"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Banknote,
  Briefcase,
  Calendar,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Hash,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Settings2,
  Sparkles,
  Star,
  TimerReset,
  TrendingUp,
  User as UserIcon,
  Wrench,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import type { ApiSuccess, BookingStatus } from "@/types";

/* ---------- Backend payload shapes ---------- */

interface TechProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  role: "TECHNICIAN";
  status?: "ACTIVE" | "BLOCKED";
  createdAt?: string;
}

interface TechSummary {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  completedBookings: number;
  upcomingBookings: number;
  averageRating: number;
  totalReviews: number;
}

interface EarningsByMonth {
  month: string; // "YYYY-MM"
  amount: number;
}

interface TechEarnings {
  total: number;
  thisMonth: number;
  lastMonth: number;
  byMonth: EarningsByMonth[];
}

interface TechRecentBooking {
  id: string;
  bookingDate: string; // "YYYY-MM-DD"
  startTime: string; // "h:mm AM/PM"
  endTime: string;
  status: BookingStatus;
  totalAmount: string | number;
  service?: { id: string; title: string };
  customer?: { id: string; name: string; profileImage?: string | null };
}

interface TechUpcomingBooking extends Omit<TechRecentBooking, "totalAmount"> {
  customerAddress?: string | null;
}

interface TechReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  customer?: { id: string; name: string; profileImage?: string | null };
  service?: { id: string; title: string };
}

interface TechDashboardPayload {
  profile: TechProfile;
  technicianSince?: string;
  summary: TechSummary;
  bookingStatusBreakdown: Record<string, number>;
  earnings: TechEarnings;
  recentBookings: TechRecentBooking[];
  upcomingBookings: TechUpcomingBooking[];
  recentReviews: TechReview[];
}

export default function TechnicianDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const loadMe = useAuthStore((s) => s.loadMe);

  // Hydrate the auth store
  useEffect(() => {
    if (!initialized) loadMe();
  }, [initialized, loadMe]);

  // Wrong role → push to right dashboard; not logged in → /login
  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    if (!user) {
      router.replace("/login?next=/tech");
    } else if (user.role === "CUSTOMER") {
      router.replace("/dashboard");
    } else if (user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [initialized, user, router]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<TechDashboardPayload>
  >({
    queryKey: ["technician-dashboard"],
    queryFn: async () => (await api.get("/technicians/me/dashboard")).data,
    enabled: Boolean(user && user.role === "TECHNICIAN"),
    staleTime: 30_000,
  });

  const payload = data?.data;
  const summary = payload?.summary;
  const earnings = payload?.earnings;
  const recent = payload?.recentBookings ?? [];
  const upcoming = payload?.upcomingBookings ?? [];
  const reviews = payload?.recentReviews ?? [];
  const profile = payload?.profile;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName =
    (user?.name || profile?.name || "").split(" ")[0] || "there";

  return (
    <>
      <PublicNavbar />
      <div className="aurora-bg" aria-hidden="true" />

      <main className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 hero-overlay"
        />

        <div className="container py-8 md:py-12">
          {/* Header */}
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
                  <Briefcase className="h-3.5 w-3.5" />
                  Technician Dashboard
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
                  Track your bookings, earnings, and reviews — all in one
                  place.
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
                  <Button variant="outline" asChild>
                    <Link href="/tech/availability">
                      <Settings2 className="h-4 w-4" />
                      Availability
                    </Link>
                  </Button>
                  <Button variant="gradient" asChild>
                    <Link href="/tech/services/new">
                      <Wrench className="h-4 w-4" />
                      Add service
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Profile quick card */}
          {profile ? <ProfileCard profile={profile} /> : null}

          {/* Soft banner — only for unexpected errors, not missing endpoints */}
          {isError && !isEndpointMissing(error) ? (
            <div className="my-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
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
            <div className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  Technician dashboard metrics unavailable.
                </p>
                <p className="text-muted-foreground mt-1">
                  The backend isn&apos;t serving{" "}
                  <code>/technicians/me/dashboard</code> yet. Start the local
                  backend (<code>npm run dev</code> in <code>FixltNow-Backend/</code>)
                  or push the latest backend code.
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
          <section className="mt-6 mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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
                    label="Earnings (lifetime)"
                    value={formatBDT(earnings?.total ?? 0)}
                    icon={Banknote}
                    accent="from-amber-500/15 to-orange-500/10"
                    text
                  />
                </>
              )}
          </section>

          {/* Earnings + monthly chart */}
          <section className="mb-8">
            <EarningsCard
              loading={isLoading}
              earnings={earnings}
            />
          </section>

          {/* Status breakdown */}
          <section className="mb-8">
            <StatusBreakdown
              loading={isLoading}
              breakdown={payload?.bookingStatusBreakdown}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upcoming jobs */}
            <section className="lg:col-span-2 card-premium card-halo p-5 sm:p-6">
              <SectionHeader
                icon={CalendarClock}
                title="Upcoming jobs"
                subtitle="Scheduled work in the next 7 days"
                right={
                  <Link
                    href="/tech/bookings"
                    className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View all
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
                  icon={Inbox}
                  title="No upcoming jobs"
                  description="Once customers book you, their jobs will appear here."
                />
              ) : (
                <ul className="mt-5 space-y-3">
                  {upcoming.map((b) => (
                    <UpcomingJobRow key={b.id} booking={b} />
                  ))}
                </ul>
              )}
            </section>

            {/* Reviews */}
            <section className="card-premium card-halo p-5 sm:p-6">
              <SectionHeader
                icon={Star}
                title="Recent reviews"
                subtitle="What customers are saying"
                right={
                  <Link
                    href="/tech/reviews"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View all
                  </Link>
                }
              />

              {isLoading ? (
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <EmptyMini
                  icon={Star}
                  title="No reviews yet"
                  description="Complete a job to encourage customers to leave a rating."
                />
              ) : (
                <ul className="mt-5 space-y-4">
                  {reviews.slice(0, 4).map((r) => (
                    <li key={r.id} className="flex items-start gap-3">
                      <Avatar name={r.customer?.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {r.customer?.name ?? "Customer"}
                          </span>
                          <Stars value={r.rating} compact />
                        </div>
                        <p className="mt-0.5 text-sm line-clamp-2 text-foreground/90">
                          {r.comment || "No comment"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          {r.service?.title ?? "Service"} •{" "}
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Recent activity table */}
          <section className="mt-6 card-premium card-halo p-5 sm:p-6">
            <SectionHeader
              icon={TimerReset}
              title="Recent activity"
              subtitle="Your last few bookings"
            />

            {isLoading ? (
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyMini
                icon={Inbox}
                title="No activity yet"
                description="Your recent bookings will appear here."
              />
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground border-b">
                    <tr>
                      <th className="text-left py-2 pr-3">Service</th>
                      <th className="text-left py-2 pr-3">Customer</th>
                      <th className="text-left py-2 pr-3">When</th>
                      <th className="text-right py-2">Amount</th>
                      <th className="text-right py-2 pl-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recent.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-accent/40 transition-colors"
                      >
                        <td className="py-3 pr-3 font-medium">
                          {b.service?.title ?? "Service"}
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {b.customer?.name ?? "—"}
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">
                          {b.bookingDate}{" "}
                          <span className="text-xs">{b.startTime}</span>
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
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

/* ---------- Pieces ---------- */

function ProfileCard({ profile }: { profile: TechProfile }) {
  return (
    <section className="card-premium card-halo p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={profile.name} src={profile.profileImage ?? undefined} large />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight truncate">
              {profile.name}
            </h2>
            <Badge variant="info">TECHNICIAN</Badge>
            {profile.status === "ACTIVE" ? (
              <Badge variant="success" className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </Badge>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </span>
            {profile.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {profile.phone}
              </span>
            ) : null}
            {profile.createdAt ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild size="sm">
            <Link href="/tech/profile">
              <UserIcon className="h-4 w-4" />
              Edit profile
            </Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href="/tech/availability">
              <Settings2 className="h-4 w-4" />
              Availability
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

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

function EarningsCard({
  loading,
  earnings,
}: {
  loading: boolean;
  earnings?: TechEarnings;
}) {
  const total = earnings?.total ?? 0;
  const thisMonth = earnings?.thisMonth ?? 0;
  const lastMonth = earnings?.lastMonth ?? 0;
  const trend =
    lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : thisMonth > 0
      ? 100
      : 0;

  return (
    <div className="card-premium card-halo overflow-hidden p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white shadow-lg shadow-primary/30">
              <Banknote className="h-4 w-4" />
            </span>
            <h3 className="font-semibold">Earnings overview</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Track your monthly income from completed jobs.
          </p>

          {loading ? (
            <Skeleton className="mt-4 h-10 w-48" />
          ) : (
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight">
                {formatBDT(total)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-2">
                <span>Lifetime earnings</span>
                {trend !== 0 ? (
                  <Badge
                    variant={trend > 0 ? "success" : "warning"}
                    className="text-[10px]"
                  >
                    <TrendingUp className="h-3 w-3" />
                    {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%
                  </Badge>
                ) : null}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniSpend label="This month" value={thisMonth} loading={loading} />
            <MiniSpend label="Last month" value={lastMonth} loading={loading} />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Last 6 months</h4>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Earnings trend
            </span>
          </div>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <MonthlyBars data={earnings?.byMonth ?? []} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniSpend({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card/40 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-6 w-24" />
      ) : (
        <div className="mt-1 text-lg font-semibold">{formatBDT(value)}</div>
      )}
    </div>
  );
}

function MonthlyBars({ data }: { data: EarningsByMonth[] }) {
  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
        No earnings data yet
      </div>
    );
  }
  const max = Math.max(1, ...data.map((d) => d.amount));
  return (
    <div className="h-44 flex items-end gap-2 sm:gap-3">
      {data.map((d, i) => {
        const pct = Math.max(4, (d.amount / max) * 100);
        return (
          <div
            key={d.month}
            className="flex-1 flex flex-col items-center gap-1.5"
          >
            <div className="relative w-full h-36 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="w-full rounded-t-md bg-gradient-to-t from-primary via-primary/80 to-cyan-400 shadow-md shadow-primary/30"
                title={`${d.month}: ${formatBDT(d.amount)}`}
              />
            </div>
            <div className="text-[10px] font-medium text-muted-foreground">
              {monthLabel(d.month)}
            </div>
            <div className="text-[10px] text-foreground/80 truncate max-w-full">
              {d.amount > 0 ? formatBDT(d.amount) : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const idx = Number(m) - 1;
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${names[idx] ?? "?"} '${y?.slice(2)}`;
}

function StatusBreakdown({
  loading,
  breakdown,
}: {
  loading: boolean;
  breakdown?: Record<string, number>;
}) {
  const items: { key: string; label: string; variant: any; icon: any }[] = [
    { key: "PENDING", label: "Pending", variant: "warning", icon: Clock },
    { key: "ACCEPTED", label: "Accepted", variant: "info", icon: CheckCircle2 },
    { key: "PAID", label: "Paid", variant: "info", icon: CreditCard },
    {
      key: "COMPLETED",
      label: "Completed",
      variant: "success",
      icon: CheckCircle2,
    },
    {
      key: "DECLINED",
      label: "Declined",
      variant: "destructive",
      icon: XCircle,
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      variant: "destructive",
      icon: XCircle,
    },
  ];
  const total = items.reduce(
    (acc, it) => acc + (breakdown?.[it.key] ?? 0),
    0
  );

  return (
    <div className="card-premium card-halo p-5 sm:p-6">
      <SectionHeader
        icon={Hash}
        title="Bookings by status"
        subtitle="At-a-glance distribution of all your bookings"
      />
      {loading ? (
        <Skeleton className="mt-5 h-20 w-full" />
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {items.map((it) => {
              const v = breakdown?.[it.key] ?? 0;
              const Icon = it.icon;
              return (
                <Badge
                  key={it.key}
                  variant={it.variant}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {it.label}
                  <span className="ml-1 rounded-full bg-background/40 px-1.5 text-[10px] font-bold">
                    {v}
                  </span>
                </Badge>
              );
            })}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="flex h-full">
              {items.map((it) => {
                const v = breakdown?.[it.key] ?? 0;
                const pct = total > 0 ? (v / total) * 100 : 0;
                const colorMap: Record<string, string> = {
                  PENDING: "bg-amber-500",
                  ACCEPTED: "bg-sky-500",
                  PAID: "bg-blue-500",
                  COMPLETED: "bg-emerald-500",
                  DECLINED: "bg-rose-500",
                  CANCELLED: "bg-rose-400",
                };
                return (
                  <div
                    key={it.key}
                    style={{ width: `${pct}%` }}
                    className={cn("h-full", colorMap[it.key])}
                    title={`${it.label}: ${v}`}
                  />
                );
              })}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {total} total booking{total === 1 ? "" : "s"}
          </div>
        </>
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

function UpcomingJobRow({ booking }: { booking: TechUpcomingBooking }) {
  const cName = booking.customer?.name ?? "Customer";
  const initial = cName.charAt(0).toUpperCase();
  const dateStr = formatDateLong(booking.bookingDate);

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
            <CalendarCheck2 className="h-3 w-3" /> {dateStr}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {booking.startTime} – {booking.endTime}
          </span>
          {booking.customerAddress ? (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" /> {booking.customerAddress}
            </span>
          ) : null}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-muted-foreground">{cName}</div>
        <div className="mt-1">
          <StatusBadge status={booking.status} />
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

function Stars({
  value,
  compact,
}: {
  value: number;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
      <Star
        className={cn(
          compact ? "h-3 w-3" : "h-4 w-4",
          "fill-current"
        )}
      />
      <span
        className={cn(
          "text-amber-600 dark:text-amber-400 font-semibold ml-0.5",
          compact ? "text-[11px]" : "text-xs"
        )}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function Avatar({
  name,
  src,
  large,
}: {
  name?: string;
  src?: string;
  large?: boolean;
}) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  const size = large ? "h-14 w-14 text-lg" : "h-8 w-8 text-xs";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name ?? "avatar"}
        className={cn(
          size,
          "rounded-full object-cover border bg-card"
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        size,
        "rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white flex items-center justify-center font-bold"
      )}
    >
      {initial}
    </div>
  );
}

function EmptyMini({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed bg-card/30 p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function formatDateLong(yyyyMmDd: string) {
  // Booking date is "YYYY-MM-DD" from the backend format helper.
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  if (!y || !m || !d) return yyyyMmDd;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** True when the backend doesn't ship the dashboard endpoint (404 / 405). */
function isEndpointMissing(err: unknown) {
  const status = (err as any)?.response?.status;
  return status === 404 || status === 405;
}

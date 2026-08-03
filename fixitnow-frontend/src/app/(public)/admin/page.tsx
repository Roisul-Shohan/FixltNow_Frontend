"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FolderTree,
  Inbox,
  Layers,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User as UserIcon,
  Users,
  Wrench,
  Wrench as WrenchIcon,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess, BookingStatus } from "@/types";

/* ---------- Backend payload shapes ---------- */

interface AdminUsers {
  total: number;
  customers: number;
  technicians: number;
  admins: number;
  active: number;
  blocked: number;
}

interface AdminBookings {
  total: number;
  byStatus: Record<string, number>;
}

interface AdminCatalog {
  categories: number;
  services: number;
  reviews: number;
}

interface AdminRevenue {
  total: number;
  thisMonth: number;
  lastMonth: number;
  currency: string;
}

interface AdminTopCategory {
  categoryId: string | null;
  categoryName: string;
  bookingsCount: number;
}

interface AdminRecentBooking {
  id: string;
  status: BookingStatus;
  totalAmount?: string | number | null;
  createdAt: string;
  customer?: { id: string; name: string; email?: string };
  service?: { id: string; title: string };
  payment?: {
    id: string;
    status: string;
    amount?: string | number | null;
  };
}

interface AdminRecentUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TECHNICIAN" | "CUSTOMER";
  status: "ACTIVE" | "BLOCKED";
  profileImage?: string | null;
  createdAt: string;
}

interface AdminDashboardPayload {
  users: AdminUsers;
  bookings: AdminBookings;
  catalog: AdminCatalog;
  revenue: AdminRevenue;
  topCategories: AdminTopCategory[];
  recentBookings: AdminRecentBooking[];
  recentUsers: AdminRecentUser[];
}

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<AdminDashboardPayload>
  >({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await api.get("/admin/dashboard")).data,
    enabled: Boolean(user && user.role === "ADMIN"),
    staleTime: 30_000,
  });

  const payload = data?.data;
  const users = payload?.users;
  const bookings = payload?.bookings;
  const catalog = payload?.catalog;
  const revenue = payload?.revenue;
  const topCategories = payload?.topCategories ?? [];
  const recentBookings = payload?.recentBookings ?? [];
  const recentUsers = payload?.recentUsers ?? [];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName =
    (user?.name || "").split(" ")[0] || "Admin";

  return (
    <div className="py-8 md:py-12">
      {/* Header */}
      <section className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
              {greeting},{" "}
              <span className="text-gradient">{firstName}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-lg">
              Monitor platform health, manage users, and keep things
              running smoothly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/users">
                <Users className="h-4 w-4" />
                Manage users
              </Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link href="/admin/categories">
                <FolderTree className="h-4 w-4" />
                Categories
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Error */}
      {isError ? (
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

      {/* Top stat tiles */}
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {isLoading || !users
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : (
            <>
              <StatTile
                label="Users"
                value={users.total}
                sub={`${users.active} active · ${users.blocked} blocked`}
                icon={Users}
                accent="from-primary/15 to-cyan-400/10"
              />
              <StatTile
                label="Bookings"
                value={bookings?.total ?? 0}
                sub={`${users.customers} customers`}
                icon={Briefcase}
                accent="from-sky-500/15 to-blue-500/10"
              />
              <StatTile
                label="Services"
                value={catalog?.services ?? 0}
                sub={`${catalog?.categories ?? 0} categories`}
                icon={Wrench}
                accent="from-emerald-500/15 to-green-500/10"
              />
              <StatTile
                label="Revenue"
                value={formatBDT(revenue?.total ?? 0)}
                sub={`${catalog?.reviews ?? 0} reviews`}
                icon={Banknote}
                accent="from-amber-500/15 to-orange-500/10"
                text
              />
            </>
          )}
      </section>

      {/* Revenue + role breakdown */}
      <section className="mb-8">
        <RevenueAndRolesCard
          loading={isLoading}
          revenue={revenue}
          users={users}
        />
      </section>

      {/* Bookings by status + top categories */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <section className="lg:col-span-2 card-premium card-halo p-5 sm:p-6">
          <SectionHeader
            icon={Layers}
            title="Bookings by status"
            subtitle="Across all customers and technicians"
          />
          {isLoading ? (
            <Skeleton className="mt-5 h-32 w-full" />
          ) : bookings ? (
            <StatusBreakdown breakdown={bookings.byStatus} />
          ) : null}
        </section>

        <section className="card-premium card-halo p-5 sm:p-6">
          <SectionHeader
            icon={Sparkles}
            title="Top categories"
            subtitle="Most-booked this period"
          />
          {isLoading ? (
            <Skeleton className="mt-5 h-32 w-full" />
          ) : topCategories.length === 0 ? (
            <EmptyMini
              icon={Inbox}
              title="No bookings yet"
              description="Top categories will appear once customers start booking."
            />
          ) : (
            <ul className="mt-5 space-y-3">
              {topCategories.map((c, i) => {
                const max = Math.max(
                  ...topCategories.map((x) => x.bookingsCount)
                );
                const pct =
                  max > 0
                    ? Math.round((c.bookingsCount / max) * 100)
                    : 0;
                return (
                  <li key={`${c.categoryId ?? c.categoryName}-${i}`}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium truncate">
                        {c.categoryName}
                      </span>
                      <span className="text-muted-foreground">
                        {c.bookingsCount}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: 0.5,
                          delay: i * 0.05,
                        }}
                        className="h-full bg-gradient-to-r from-primary to-cyan-400"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Recent bookings table */}
      <section className="mb-8 card-premium card-halo p-5 sm:p-6">
        <SectionHeader
          icon={Clock}
          title="Recent bookings"
          subtitle="Last 5 bookings across the platform"
          right={
            <Link
              href="/admin/bookings"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          }
        />
        {isLoading ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <EmptyMini
            icon={Inbox}
            title="No bookings yet"
            description="Once customers book, their jobs will show up here."
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
                {recentBookings.map((b) => (
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
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {formatBDT(
                        b.payment?.amount ?? b.totalAmount ?? 0
                      )}
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

      {/* Recent users */}
      <section className="card-premium card-halo p-5 sm:p-6">
        <SectionHeader
          icon={UserIcon}
          title="Recent users"
          subtitle="Newest accounts on the platform"
          right={
            <Link
              href="/admin/users"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          }
        />
        {isLoading ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : recentUsers.length === 0 ? (
          <EmptyMini
            icon={Users}
            title="No users yet"
            description="Once someone signs up, they'll appear here."
          />
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentUsers.map((u) => (
              <li
                key={u.id}
                className="rounded-lg border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} src={u.profileImage ?? undefined} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {u.name}
                      </span>
                      <RoleBadge role={u.role} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                  <UserStatusBadge status={u.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick links */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/admin/users"
          icon={Users}
          title="Users"
          subtitle="View, search, block or unblock"
        />
        <QuickLink
          href="/admin/categories"
          icon={FolderTree}
          title="Categories"
          subtitle="Create and manage service categories"
        />
        <QuickLink
          href="/admin/bookings"
          icon={Briefcase}
          title="Bookings"
          subtitle="Search and audit every booking"
        />
        <QuickLink
          href="/services"
          icon={WrenchIcon}
          title="Marketplace"
          subtitle="Browse the public site"
        />
      </section>
    </div>
  );
}

/* ---------- Pieces ---------- */

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  text,
}: {
  label: string;
  value: number | string;
  sub?: string;
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
      {sub ? (
        <div className="relative mt-1 text-[11px] text-muted-foreground truncate">
          {sub}
        </div>
      ) : null}
    </motion.div>
  );
}

function RevenueAndRolesCard({
  loading,
  revenue,
  users,
}: {
  loading: boolean;
  revenue?: AdminRevenue;
  users?: AdminUsers;
}) {
  const total = revenue?.total ?? 0;
  const thisMonth = revenue?.thisMonth ?? 0;
  const lastMonth = revenue?.lastMonth ?? 0;
  const trend =
    lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : thisMonth > 0
      ? 100
      : 0;

  return (
    <div className="card-premium card-halo overflow-hidden p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white shadow-lg shadow-primary/30">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h3 className="font-semibold">Revenue & users</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Platform-wide revenue and the user base that drives it.
          </p>

          {loading ? (
            <Skeleton className="mt-4 h-10 w-48" />
          ) : (
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight">
                {formatBDT(total)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-2">
                <span>Lifetime platform revenue</span>
                {trend !== 0 ? (
                  <Badge
                    variant={trend > 0 ? "success" : "warning"}
                    className="text-[10px]"
                  >
                    {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%
                  </Badge>
                ) : null}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Mini
              label="This month"
              value={loading ? null : formatBDT(thisMonth)}
              loading={loading}
            />
            <Mini
              label="Last month"
              value={loading ? null : formatBDT(lastMonth)}
              loading={loading}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card/40 p-4">
          <h4 className="text-sm font-semibold">User mix</h4>
          {loading || !users ? (
            <Skeleton className="mt-3 h-24 w-full" />
          ) : (
            <>
              <div className="mt-3 space-y-2">
                <RoleBar
                  label="Customers"
                  value={users.customers}
                  total={users.total}
                  color="bg-sky-500"
                />
                <RoleBar
                  label="Technicians"
                  value={users.technicians}
                  total={users.total}
                  color="bg-emerald-500"
                />
                <RoleBar
                  label="Admins"
                  value={users.admins}
                  total={users.total}
                  color="bg-amber-500"
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {users.active} active · {users.blocked} blocked
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value} · {pct}%
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | null;
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
        <div className="mt-1 text-lg font-semibold">{value}</div>
      )}
    </div>
  );
}

function StatusBreakdown({
  breakdown,
}: {
  breakdown: Record<string, number>;
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
    (acc, it) => acc + (breakdown[it.key] ?? 0),
    0
  );

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        {items.map((it) => {
          const v = breakdown[it.key] ?? 0;
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
            const v = breakdown[it.key] ?? 0;
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

function StatusBadge({ status }: { status: BookingStatus }) {
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

function RoleBadge({ role }: { role: "ADMIN" | "TECHNICIAN" | "CUSTOMER" }) {
  if (role === "ADMIN")
    return <Badge variant="warning">ADMIN</Badge>;
  if (role === "TECHNICIAN")
    return <Badge variant="success">TECHNICIAN</Badge>;
  return <Badge variant="info">CUSTOMER</Badge>;
}

function UserStatusBadge({
  status,
}: {
  status: "ACTIVE" | "BLOCKED";
}) {
  if (status === "ACTIVE")
    return (
      <Badge variant="success" className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </Badge>
    );
  return (
    <Badge variant="destructive" className="inline-flex items-center gap-1">
      <XCircle className="h-3 w-3" />
      Blocked
    </Badge>
  );
}

function Avatar({
  name,
  src,
}: {
  name?: string;
  src?: string;
}) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name ?? "avatar"}
        className="h-9 w-9 rounded-full object-cover border bg-card"
      />
    );
  }
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white flex items-center justify-center font-bold">
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

function QuickLink({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="card-premium card-halo flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {subtitle}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Briefcase,
  Filter,
  Loader2,
  MapPin,
  Search,
  Star,
  Tag,
  ToggleLeft,
  Wrench,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess, Category } from "@/types";

interface ServiceTechUser {
  id: string;
  name: string;
  profileImage?: string | null;
}

interface ServiceRow {
  id: string;
  title: string;
  description?: string;
  hourlyRate: number | string;
  location?: string;
  averageRating?: number;
  totalReviews?: number;
  category?: Category;
  technician?: {
    user?: ServiceTechUser;
  };
}

interface ServicesMeta {
  page: number;
  limit: number;
  total: number;
}

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "top", label: "Top rated (4★+)" },
  { key: "unrated", label: "Unrated" },
] as const;
type StatusFilterKey = (typeof STATUS_FILTERS)[number]["key"];

export default function AdminServicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [categoryId, setCategoryId] = useState<string>("ALL");

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<ServiceRow[]>
  >({
    queryKey: ["admin-services", search, statusFilter, categoryId],
    queryFn: async () => {
      const res = await api.get("/admin/services", {
        params: {
          limit: 100,
          searchTerm: search.trim() || undefined,
          ...(categoryId !== "ALL" ? { categoryId } : {}),
        },
      });
      return res.data;
    },
    staleTime: 30_000,
  });

  const { data: cats } = useQuery<ApiSuccess<Category[]>>({
    queryKey: ["admin-services-categories"],
    queryFn: async () => (await api.get("/categories")).data,
    staleTime: 60_000,
  });

  const rawRows = useMemo(() => {
    const d: any = (data as any)?.data;
    if (Array.isArray(d)) return d as ServiceRow[];
    if (Array.isArray(d?.data)) return d.data as ServiceRow[];
    return [];
  }, [data]);

  const meta: ServicesMeta | undefined = (data as any)?.meta;

  const rows = useMemo(() => {
    return rawRows.filter((s) => {
      const rating = Number(s.averageRating ?? 0);
      if (statusFilter === "top" && rating < 4) return false;
      if (statusFilter === "unrated" && rating > 0) return false;
      if (categoryId !== "ALL") {
        // Server filters by categoryId; double-check client-side as a safety net.
        if (s.category?.id !== categoryId) {
          return false;
        }
      }
      return true;
    });
  }, [rawRows, statusFilter, categoryId]);

  const stats = useMemo(() => {
    const total = rawRows.length;
    const rated = rawRows.filter((s) => Number(s.averageRating ?? 0) > 0);
    const avgRating =
      rated.length > 0
        ? rated.reduce((acc, s) => acc + Number(s.averageRating ?? 0), 0) /
          rated.length
        : 0;
    const avgRate =
      rawRows.length > 0
        ? rawRows.reduce(
            (acc, s) => acc + Number(s.hourlyRate ?? 0),
            0
          ) / rawRows.length
        : 0;
    return { total, avgRating, avgRate };
  }, [rawRows]);

  const categories: Category[] = useMemo(() => {
    const d: any = (cats as any)?.data;
    return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
  }, [cats]);

  return (
    <div className="space-y-6">
      <Header
        total={stats.total}
        avgRating={stats.avgRating}
        avgRate={stats.avgRate}
        meta={meta}
      />

      {/* Filters */}
      <section className="rounded-2xl border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filter services</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by service title or description…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="ALL">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-background hover:bg-accent text-foreground/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Body */}
      <section>
        {isError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-destructive">
                Couldn&apos;t load platform services.
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
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-3">
            {rows.map((s) => (
              <ServiceCard key={s.id} service={s} />
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
  avgRating,
  avgRate,
  meta,
}: {
  total: number;
  avgRating: number;
  avgRate: number;
  meta?: ServicesMeta;
}) {
  return (
    <header>
      <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
        <Wrench className="h-3.5 w-3.5" />
        Services
      </div>
      <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
        All platform services
      </h1>
      <p className="text-sm md:text-base text-muted-foreground mt-1">
        Browse every service offered on FixltNow — read-only catalog
        oversight.
      </p>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total" value={total.toString()} icon={Briefcase} />
        <Stat
          label="Avg rating"
          value={avgRating > 0 ? avgRating.toFixed(2) : "—"}
          icon={Star}
        />
        <Stat
          label="Avg rate / hr"
          value={avgRate > 0 ? formatBDT(avgRate) : "—"}
          icon={Tag}
        />
        <Stat
          label="Page total"
          value={meta ? `${meta.total}` : "—"}
          icon={Loader2}
        />
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-lg font-bold tracking-tight">{value}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Wrench className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">No services match</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Try a different search term or category filter.
      </p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/admin">← Back to admin dashboard</Link>
      </Button>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceRow }) {
  const techName = service.technician?.user?.name ?? "Technician";
  const initial = techName.charAt(0).toUpperCase();
  const rating = Number(service.averageRating ?? 0);
  const reviews = Number(service.totalReviews ?? 0);

  return (
    <li className="rounded-xl border bg-card p-4 sm:p-5 hover:shadow-md hover:border-primary/40 transition-all">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-semibold flex items-center justify-center">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold tracking-tight truncate">
              {service.title}
            </h3>
            {service.category?.name ? (
              <Badge variant="secondary" className="font-normal">
                <Tag className="h-3 w-3 mr-1" />
                {service.category.name}
              </Badge>
            ) : null}
            {reviews > 0 ? (
              <Badge variant="outline" className="font-normal">
                <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                {rating.toFixed(1)}
                <span className="ml-1 text-muted-foreground">({reviews})</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="font-normal text-muted-foreground">
                <Star className="h-3 w-3 mr-1" />
                Unrated
              </Badge>
            )}
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            Offered by {techName}
          </p>

          {service.description ? (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              {formatBDT(service.hourlyRate)} / hr
            </span>
            {service.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {service.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <ToggleLeft className="h-3.5 w-3.5" />
              Visible to customers
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
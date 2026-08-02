"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  FolderTree,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import type { ApiSuccess, Role } from "@/types";

/* ---------- Backend payload shapes ---------- */

interface AdminCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { service?: number };
}

interface AdminCategoriesMeta {
  page: number;
  limit: number;
  total: number;
}

type SortKey = "createdAt" | "name";
type SortOrder = "asc" | "desc";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const loadMe = useAuthStore((s) => s.loadMe);

  // Hydrate auth store
  useEffect(() => {
    if (!initialized) loadMe();
  }, [initialized, loadMe]);

  // Wrong role → push to right dashboard; not logged in → /login
  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    if (!me) {
      router.replace("/login?next=/admin/categories");
    } else if (me.role === "CUSTOMER") {
      router.replace("/dashboard");
    } else if (me.role === "TECHNICIAN") {
      router.replace("/tech");
    }
  }, [initialized, me, router]);

  // Filter / sort / pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const limit = 12;

  // Debounce search input so we don't hammer the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset pages when filters change
  useEffect(() => {
    setPage(1);
  }, [sortBy, sortOrder]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("searchTerm", debouncedSearch);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return params.toString();
  }, [debouncedSearch, sortBy, sortOrder, page, limit]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<AdminCategory[]>
  >({
    queryKey: [
      "admin-categories",
      { debouncedSearch, sortBy, sortOrder, page, limit },
    ],
    queryFn: async () =>
      (await api.get(`/category?${queryString}`)).data,
    enabled: Boolean(me && me.role === "ADMIN"),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });

  const categories = data?.data ?? [];
  const meta = data?.meta as AdminCategoriesMeta | undefined;
  const total = meta?.total ?? 0;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / limit)) : 1;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = (me?.name || "").split(" ")[0] || "Admin";

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const hasActiveFilters = Boolean(debouncedSearch);

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
          {/* Breadcrumb + header */}
          <section className="mb-6">
            <div className="text-xs text-muted-foreground">
              <Link
                href="/admin"
                className="hover:text-foreground transition-colors"
              >
                Admin
              </Link>
              <span className="mx-1.5">/</span>
              <span>Categories</span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <FolderTree className="h-3.5 w-3.5" />
                  Category Management
                </p>
                <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
                  {greeting},{" "}
                  <span className="text-gradient">{firstName}</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground max-w-lg">
                  Browse every service category on the platform. Toggle
                  platforms, expand offerings, and keep catalog fresh.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
                <Button variant="gradient" asChild>
                  <Link href="/admin">
                    <ChevronLeft className="h-4 w-4" />
                    Back to dashboard
                  </Link>
                </Button>
              </div>
            </motion.div>
          </section>

          {/* Filter bar */}
          <section className="card-premium card-halo p-4 sm:p-5 mb-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1 min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or description…"
                  className="w-full h-10 rounded-lg border bg-background pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:bg-accent"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch("")}
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>
                {isLoading ? (
                  <Skeleton className="inline-block h-3 w-12 align-middle" />
                ) : (
                  <span className="font-semibold text-foreground">
                    {total}
                  </span>
                )}{" "}
                total categor{total === 1 ? "y" : "ies"}
              </span>
              {meta ? (
                <span>
                  · Page <span className="font-semibold">{meta.page}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                </span>
              ) : null}
            </div>
          </section>

          {/* Error banner */}
          {isError ? (
            <div className="my-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-destructive">
                  Couldn&apos;t load categories.
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

          {/* Categories grid */}
          <section className="card-premium card-halo p-0 overflow-hidden">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="p-10">
                <EmptyMini
                  icon={Inbox}
                  title="No categories match your filters"
                  description="Try clearing the search to see all categories."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5">
                {categories.map((c) => (
                  <CategoryCard key={c.id} category={c} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t px-4 py-3">
                <div className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {(meta.page - 1) * meta.limit + 1}–
                    {Math.min(meta.page * meta.limit, meta.total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {meta.total}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <PageNumbers
                    page={meta.page}
                    totalPages={totalPages}
                    onChange={setPage}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={meta.page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

/* ---------- Pieces ---------- */

function SortHeader({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: SortOrder;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors",
        active ? "text-foreground" : "hover:text-foreground"
      )}
    >
      {label}
      <ChevronUp
        className={cn(
          "h-3 w-3 transition-transform",
          active ? "" : "opacity-30",
          active && order === "desc" ? "rotate-180" : ""
        )}
      />
    </button>
  );
}

function CategoryCard({ category }: { category: AdminCategory }) {
  const serviceCount = category._count?.service ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white flex items-center justify-center shrink-0">
            <Tag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{category.name}</h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {category.id}
            </p>
          </div>
        </div>
        {category.isActive ? (
          <Badge variant="success" className="inline-flex items-center gap-1 shrink-0">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        ) : (
          <Badge variant="warning" className="inline-flex items-center gap-1 shrink-0">
            <ShieldCheck className="h-3 w-3" />
            Inactive
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
        {category.description || "No description provided."}
      </p>

      <div className="mt-auto flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <FolderTree className="h-3 w-3" />
          {serviceCount} service{serviceCount === 1 ? "" : "s"}
        </span>
        <span>{category.createdAt ? formatDate(category.createdAt) : "—"}</span>
      </div>
    </motion.div>
  );
}

function PageNumbers({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    items.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
      items.push("ellipsis");
    }
  }

  return (
    <div className="hidden sm:flex items-center gap-1 mx-1">
      {items.map((it, i) =>
        it === "ellipsis" ? (
          <span
            key={`e-${i}`}
            className="px-1 text-muted-foreground text-xs"
          >
            …
          </span>
        ) : (
          <button
            key={it}
            onClick={() => onChange(it)}
            className={cn(
              "h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors",
              it === page
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-muted-foreground"
            )}
          >
            {it}
          </button>
        )
      )}
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
    <div className="flex flex-col items-center text-center py-4">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
    </div>
  );
}

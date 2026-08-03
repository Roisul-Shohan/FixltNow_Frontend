"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  Inbox,
  Loader2,
  Mail,
  Phone,
  Power,
  Search,
  ShieldCheck,
  Star,
  User as UserIcon,
  FolderTree,
  Wrench,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dropdown } from "@/components/ui/dropdown-menu";
import type { ApiSuccess, Role } from "@/types";

/* ---------- Backend payload shapes ---------- */

interface AdminUserTechnicianProfile {
  id: string;
  bio?: string | null;
  yearsOfExperience?: number | null;
  averageRating?: number | null;
  totalReviews?: number | null;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  profileImage?: string | null;
  status: "ACTIVE" | "BLOCKED";
  stripeCustomerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  technicianProfile?: AdminUserTechnicianProfile | null;
}

interface AdminUsersMeta {
  page: number;
  limit: number;
  total: number;
}

interface AdminUsersData {
  meta: AdminUsersMeta;
  data: AdminUser[];
}

type RoleFilter = "" | Role;
type StatusFilter = "" | "ACTIVE" | "BLOCKED";
type SortKey = "createdAt" | "name" | "email" | "role";
type SortOrder = "asc" | "desc";

export default function AdminUsersPage() {
  const me = useAuthStore((s) => s.user);

  // Filter / sort / pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const limit = 10;

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
  }, [role, status, sortBy, sortOrder]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("searchTerm", debouncedSearch);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return params.toString();
  }, [debouncedSearch, role, status, sortBy, sortOrder, page, limit]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<AdminUser[]>
  >({
    queryKey: [
      "admin-users",
      { debouncedSearch, role, status, sortBy, sortOrder, page, limit },
    ],
    queryFn: async () =>
      (await api.get(`/admin/users?${queryString}`)).data,
    enabled: Boolean(me && me.role === "ADMIN"),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });

  const users = data?.data ?? [];
  const meta = data?.meta as AdminUsersMeta | undefined;
  const total = meta?.total ?? 0;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / limit)) : 1;

  // ──── Status toggle mutation ────────────────────────────────────────
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (input: { id: string; status: "ACTIVE" | "BLOCKED" }) =>
      (await api.patch(`/admin/users/${input.id}`, { status: input.status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

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

  const hasActiveFilters =
    Boolean(debouncedSearch) || Boolean(role) || Boolean(status);

  return (
    <div className="py-8 md:py-12">
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
            <span>Users</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                User Management
              </p>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
                {greeting},{" "}
                <span className="text-gradient">{firstName}</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground max-w-lg">
                Search, filter, and manage every customer, technician, and
                admin on the platform.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="gradient" asChild>
                <Link href="/admin/categories">
                  <FolderTree className="h-4 w-4" />
                  Manage categories
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
                placeholder="Search by name or technician bio…"
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

            <div className="flex flex-wrap items-center gap-2">
              <Dropdown
                label="Role"
                value={role}
                onChange={(v) => setRole(v as RoleFilter)}
                options={[
                  { label: "All roles", value: "" },
                  { label: "Customer", value: "CUSTOMER", icon: UserIcon },
                  {
                    label: "Technician",
                    value: "TECHNICIAN",
                    icon: Wrench,
                  },
                  { label: "Admin", value: "ADMIN", icon: ShieldCheck },
                ]}
              />
              <Dropdown
                label="Status"
                value={status}
                onChange={(v) => setStatus(v as StatusFilter)}
                options={[
                  { label: "All status", value: "" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Blocked", value: "BLOCKED" },
                ]}
              />
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setRole("");
                    setStatus("");
                  }}
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              ) : null}
            </div>
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
              total result{total === 1 ? "" : "s"}
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
                Couldn&apos;t load users.
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

        {/* Users table */}
        <section className="card-premium card-halo p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground border-b">
                <tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>
                    <SortHeader
                      label="Joined"
                      active={sortBy === "createdAt"}
                      order={sortOrder}
                      onClick={() => toggleSort("createdAt")}
                    />
                  </Th>
                  <Th>Contact</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="p-3">
                          <Skeleton className="h-12 w-full" />
                        </td>
                      </tr>
                    ))
                  : users.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="p-10">
                        <EmptyMini
                          icon={Inbox}
                          title="No users match your filters"
                          description="Try clearing the search or filters."
                        />
                      </td>
                    </tr>
                  )
                  : users.map((u) => (
                      <UserRow
                        key={u.id}
                        user={u}
                        pending={updateStatus.isPending}
                        onToggle={() =>
                          updateStatus.mutate({
                            id: u.id,
                            status:
                              u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                          })
                        }
                      />
                    ))}
              </tbody>
            </table>
          </div>

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
  );
}

/* ---------- Pieces ---------- */

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("text-left py-3 px-4 font-medium", className)}>
      {children}
    </th>
  );
}

function SortHeader({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: "asc" | "desc";
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
          active && order === "desc" ? "rotate-180" : "",
          active && order === "asc" ? "" : ""
        )}
      />
    </button>
  );
}

function Avatar({
  name,
  src,
}: {
  name?: string;
  src?: string | null;
}) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name ?? "avatar"}
        className="h-10 w-10 rounded-full object-cover border bg-card"
      />
    );
  }
  return (
    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white flex items-center justify-center font-bold">
      {initial}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  if (role === "ADMIN")
    return (
      <Badge variant="warning" className="inline-flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        Admin
      </Badge>
    );
  if (role === "TECHNICIAN")
    return (
      <Badge variant="success" className="inline-flex items-center gap-1">
        <Wrench className="h-3 w-3" />
        Technician
      </Badge>
    );
  return (
    <Badge variant="info" className="inline-flex items-center gap-1">
      <UserIcon className="h-3 w-3" />
      Customer
    </Badge>
  );
}

function StatusBadge({ status }: { status: "ACTIVE" | "BLOCKED" }) {
  if (status === "ACTIVE")
    return (
      <Badge variant="success" className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </Badge>
    );
  return (
    <Badge variant="destructive" className="inline-flex items-center gap-1">
      <Ban className="h-3 w-3" />
      Blocked
    </Badge>
  );
}

function UserRow({
  user,
  pending,
  onToggle,
}: {
  user: AdminUser;
  pending: boolean;
  onToggle: () => void;
}) {
  const isAdmin = user.role === "ADMIN";
  const hasProfile = Boolean(user.technicianProfile);
  const rating = user.technicianProfile?.averageRating ?? null;
  const reviews = user.technicianProfile?.totalReviews ?? 0;

  return (
    <tr className="hover:bg-accent/40 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.profileImage ?? undefined} />
          <div className="min-w-0">
            <div className="font-semibold truncate">{user.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {user.id}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-1">
          <RoleBadge role={user.role} />
          {hasProfile ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 text-amber-500" />
              {rating && Number(rating) > 0
                ? `${Number(rating).toFixed(1)} · ${reviews} review${
                    reviews === 1 ? "" : "s"
                  }`
                : "No reviews yet"}
            </span>
          ) : null}
        </div>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
        {user.createdAt ? formatDate(user.createdAt) : "—"}
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-1 text-xs">
          <span className="inline-flex items-center gap-1 text-muted-foreground truncate">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{user.email}</span>
          </span>
          {user.phone ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              {user.phone}
            </span>
          ) : null}
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        {isAdmin ? (
          <span className="text-xs text-muted-foreground italic">
            Protected
          </span>
        ) : (
          <Button
            size="sm"
            variant={user.status === "ACTIVE" ? "outline" : "default"}
            onClick={onToggle}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : user.status === "ACTIVE" ? (
              <Ban className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            {user.status === "ACTIVE" ? "Block" : "Unblock"}
          </Button>
        )}
      </td>
    </tr>
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
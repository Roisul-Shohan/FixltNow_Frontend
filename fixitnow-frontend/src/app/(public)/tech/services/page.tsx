"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpRight,
  AlertTriangle,
  Briefcase,
  CalendarCheck2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Wallet,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

/* ----------------------- Types ----------------------- */

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface ServiceRow {
  id: string;
  title: string;
  description?: string;
  hourlyRate: number | string;
  location?: string;
  isActive: boolean;
  averageRating?: number;
  totalReviews?: number;
  category?: ServiceCategory;
  _count?: { booking?: number };
  createdAt?: string;
}

interface ServiceStats {
  totalServices: number;
  averageHourlyRate: number;
  activeServices: number;
}

interface ServicesPayload {
  services: ServiceRow[];
  stats: ServiceStats;
  meta?: { page: number; limit: number; total: number };
}

interface Category {
  id: string;
  name: string;
}

interface EditFormState {
  title: string;
  description: string;
  categoryId: string;
  location: string;
  hourlyRate: string;
}

const EMPTY_EDIT: EditFormState = {
  title: "",
  description: "",
  categoryId: "",
  location: "",
  hourlyRate: "",
};

/* ----------------------- Page ----------------------- */

export default function TechnicianServicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Dialog state
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [deleting, setDeleting] = useState<ServiceRow | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<ApiSuccess<ServicesPayload>>({
    queryKey: ["tech-services"],
    queryFn: async () => (await api.get("/technicians/me/services")).data,
    staleTime: 30_000,
  });

  const payload = data?.data;
  const services = useMemo<ServiceRow[]>(
    () => payload?.services ?? [],
    [payload?.services]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (activeFilter === "active" && !s.isActive) return false;
      if (activeFilter === "inactive" && s.isActive) return false;
      if (!q) return true;
      return (
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.category?.name?.toLowerCase().includes(q)
      );
    });
  }, [services, search, activeFilter]);

  const toggleActive = useMutation({
    mutationFn: async (vars: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/technicians/services/${vars.id}`, {
        isActive: vars.isActive,
      });
      return res.data;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.isActive ? "Service activated" : "Service paused");
      qc.invalidateQueries({ queryKey: ["tech-services"] });
      qc.invalidateQueries({ queryKey: ["technician-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Update failed"
      );
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/technicians/services/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Service deleted");
      qc.invalidateQueries({ queryKey: ["tech-services"] });
      qc.invalidateQueries({ queryKey: ["technician-dashboard"] });
      setDeleting(null);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Delete failed"
      );
    },
  });

  const stats = payload?.stats;

  return (
    <div className="py-8 md:py-12">
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
              <Briefcase className="h-3.5 w-3.5" />
              My Services
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl md:text-5xl font-bold tracking-tight"
            >
              Manage what you{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                offer
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="max-w-xl text-sm md:text-base text-muted-foreground"
            >
              Add, pause, edit, or remove the services customers can book.
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
              <Button asChild variant="gradient">
                <Link href="/tech/services/new">
                  <Plus className="h-4 w-4" />
                  Add service
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryTile
          label="Total services"
          value={stats?.totalServices ?? services.length}
          icon={Briefcase}
        />
        <SummaryTile
          label="Active"
          value={
            stats?.activeServices ??
            services.filter((s) => s.isActive).length
          }
          icon={ToggleRight}
        />
        <SummaryTile
          label="Avg hourly rate"
          value={
            stats?.averageHourlyRate
              ? formatBDT(stats.averageHourlyRate)
              : "—"
          }
          icon={Wallet}
        />
      </section>

      {/* Toolbar */}
      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          {(
            [
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "inactive", label: "Paused" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveFilter(opt.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeFilter === opt.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
              "Failed to load services"
            }
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <Empty
            hasAny={services.length > 0}
            onAddHref="/tech/services/new"
          />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                toggling={toggleActive.isPending}
                deleting={deleteService.isPending}
                onToggle={() =>
                  toggleActive.mutate({
                    id: s.id,
                    isActive: !s.isActive,
                  })
                }
                onEdit={() => setEditing(s)}
                onDelete={() => setDeleting(s)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Edit dialog */}
      <EditServiceDialog
        service={editing}
        onClose={() => setEditing(null)}
      />

      {/* Delete confirm */}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete service?</DialogTitle>
            </div>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{deleting?.title}&rdquo;
              </span>
              . Existing bookings linked to this service will not be
              affected, but customers won&apos;t be able to book it again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={deleteService.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleting && deleteService.mutate(deleting.id)}
              disabled={deleteService.isPending}
            >
              {deleteService.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------- Components ----------------------- */

function SummaryTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function ServiceCard({
  service,
  toggling,
  deleting,
  onToggle,
  onEdit,
  onDelete,
}: {
  service: ServiceRow;
  toggling: boolean;
  deleting: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rating = service.averageRating ?? 0;
  const reviews = service.totalReviews ?? 0;
  const [confirmPause, setConfirmPause] = useState(false);

  // Reset confirm when the row's active state changes externally
  useEffect(() => {
    setConfirmPause(false);
  }, [service.isActive]);

  const handleMainClick = () => {
    if (service.isActive) {
      // Pausing is risky — show inline confirm
      setConfirmPause(true);
    } else {
      // Activating is safe — execute immediately
      onToggle();
    }
  };

  const confirmPauseAction = () => {
    setConfirmPause(false);
    onToggle();
  };

  return (
    <motion.li
      layout
      className="group rounded-2xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold tracking-tight truncate">
              {service.title}
            </h3>
            {service.isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="secondary">Paused</Badge>
            )}
          </div>
          {service.category?.name ? (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              {service.category.name}
            </span>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">
            {formatBDT(service.hourlyRate)}
          </div>
          <div className="text-[10px] text-muted-foreground">/ hour</div>
        </div>
      </div>

      {service.description ? (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {service.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {service.location ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {service.location}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          {service._count?.booking ?? 0} bookings
        </span>
        <span className="inline-flex items-center gap-1">
          <Star
            className={cn(
              "h-3.5 w-3.5",
              rating > 0 ? "fill-yellow-400 text-yellow-400" : ""
            )}
          />
          {rating.toFixed(1)} ({reviews})
        </span>
      </div>

      {/* Inline confirm popover for pausing */}
      {confirmPause ? (
        <div
          role="alertdialog"
          aria-label="Confirm pause service"
          className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3"
        >
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Pausing will hide this service from new bookings. Existing
            bookings remain.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmPause(false)}
              disabled={toggling}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmPauseAction}
              disabled={toggling}
              className="bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/30"
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              Yes, pause
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={service.isActive ? "outline" : "default"}
            onClick={handleMainClick}
            disabled={toggling || deleting}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : service.isActive ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {service.isActive ? "Pause" : "Activate"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            disabled={toggling || deleting}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={toggling || deleting}
            className="ml-auto text-destructive hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
          <Button asChild size="sm" variant="link">
            <Link href={`/services/${service.id}`}>
              View <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}
    </motion.li>
  );
}

/* ----------------------- Edit Dialog ----------------------- */

function EditServiceDialog({
  service,
  onClose,
}: {
  service: ServiceRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<EditFormState>(EMPTY_EDIT);
  const [errors, setErrors] = useState<
    Partial<Record<keyof EditFormState, string>>
  >({});

  // Hydrate the form when the dialog opens for a new service
  useEffect(() => {
    if (!service) {
      setForm(EMPTY_EDIT);
      setErrors({});
      return;
    }
    setForm({
      title: service.title ?? "",
      description: service.description ?? "",
      categoryId: service.category?.id ?? "",
      location: service.location ?? "",
      hourlyRate:
        service.hourlyRate != null ? String(service.hourlyRate) : "",
    });
    setErrors({});
  }, [service]);

  const { data: categoriesData, isLoading: catsLoading } = useQuery<
    ApiSuccess<Category[]>
  >({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data,
    enabled: !!service,
    staleTime: 5 * 60_000,
  });

  const categories: Category[] = useMemo(
    () => categoriesData?.data ?? [],
    [categoriesData?.data]
  );

  const updateService = useMutation({
    mutationFn: async (body: {
      title?: string;
      description?: string;
      categoryId?: string;
      location?: string;
      hourlyRate?: number;
    }) => {
      const res = await api.patch(
        `/technicians/services/${service!.id}`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Service updated");
      qc.invalidateQueries({ queryKey: ["tech-services"] });
      qc.invalidateQueries({ queryKey: ["technician-dashboard"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Update failed"
      );
    },
  });

  const set = <K extends keyof EditFormState>(
    key: K,
    val: EditFormState[K]
  ) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof EditFormState, string>> = {};
    if (form.title.trim().length < 3)
      next.title = "Title must be at least 3 characters";
    if (form.categoryId && !categories.find((c) => c.id === form.categoryId))
      next.categoryId = "Pick a valid category";
    if (form.location.trim().length > 0 && form.location.trim().length < 2)
      next.location = "Location is too short";
    if (form.hourlyRate) {
      const rate = Number(form.hourlyRate);
      if (Number.isNaN(rate) || rate <= 0)
        next.hourlyRate = "Hourly rate must be greater than 0";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: {
      title?: string;
      description?: string;
      categoryId?: string;
      location?: string;
      hourlyRate?: number;
    } = {};
    if (form.title.trim()) payload.title = form.title.trim();
    if (form.description.trim())
      payload.description = form.description.trim();
    if (form.categoryId) payload.categoryId = form.categoryId;
    if (form.location.trim()) payload.location = form.location.trim();
    if (form.hourlyRate) payload.hourlyRate = Number(form.hourlyRate);

    if (Object.keys(payload).length === 0) {
      toast.error("No changes to save");
      return;
    }
    updateService.mutate(payload);
  };

  return (
    <Dialog open={!!service} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit service</DialogTitle>
          <DialogDescription>
            Update the details customers see when booking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title" className="mb-1.5 inline-block">
              Title
            </Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Service title"
            />
            {errors.title ? (
              <p className="mt-1 text-xs text-destructive">{errors.title}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="edit-description" className="mb-1.5 inline-block">
              Description
            </Label>
            <textarea
              id="edit-description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What does this service include?"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-category" className="mb-1.5 inline-block">
                Category
              </Label>
              <select
                id="edit-category"
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                disabled={catsLoading}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Keep current</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId ? (
                <p className="mt-1 text-xs text-destructive">
                  {errors.categoryId}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="edit-rate" className="mb-1.5 inline-block">
                Hourly rate (BDT)
              </Label>
              <Input
                id="edit-rate"
                type="number"
                min="0"
                value={form.hourlyRate}
                onChange={(e) => set("hourlyRate", e.target.value)}
                placeholder="0"
              />
              {errors.hourlyRate ? (
                <p className="mt-1 text-xs text-destructive">
                  {errors.hourlyRate}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <Label htmlFor="edit-location" className="mb-1.5 inline-block">
              Location
            </Label>
            <Input
              id="edit-location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Service area"
            />
            {errors.location ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.location}
              </p>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateService.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateService.isPending}>
              {updateService.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------- Empty / Errors ----------------------- */

function Empty({
  hasAny,
  onAddHref,
}: {
  hasAny: boolean;
  onAddHref: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Briefcase className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">
        {hasAny ? "No services match" : "No services yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasAny
          ? "Try a different search or filter."
          : "Create your first service to start receiving bookings."}
      </p>
      <Button asChild variant="gradient" className="mt-4">
        <Link href={onAddHref}>
          <Plus className="h-4 w-4" />
          {hasAny ? "Add another" : "Add service"}
        </Link>
      </Button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border bg-card p-5 animate-pulse h-48"
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
      <p className="font-semibold text-destructive">Couldn&apos;t load services</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-3">
        Try again
      </Button>
    </div>
  );
}
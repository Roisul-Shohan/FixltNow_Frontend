"use client";

import { useMemo, useState } from "react";
import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  PencilLine,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, toDate, safeFormatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  );
}

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}

interface ReviewTechnician {
  id: string;
  user: {
    name: string;
    profileImage?: string | null;
  };
}

interface ReviewService {
  id: string;
  title: string;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  service?: ReviewService;
  technician?: ReviewTechnician;
}

export default function CustomerReviewsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<ApiSuccess<ReviewRow[]>>({
    queryKey: ["customer-reviews"],
    queryFn: async () => (await api.get("/reviews/my")).data,
    staleTime: 30_000,
  });

  const rows = useMemo<ReviewRow[]>(() => {
    const raw = (data as any)?.data;
    return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  }, [data]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => {
      const service = r.service?.title?.toLowerCase() ?? "";
      const tech = r.technician?.user?.name?.toLowerCase() ?? "";
      const comment = r.comment?.toLowerCase() ?? "";
      return service.includes(q) || tech.includes(q) || comment.includes(q);
    });
  }, [rows, query]);

  const stats = useMemo(() => {
    const count = rows.length;
    const avg =
      count > 0
        ? rows.reduce((s, r) => s + (r.rating ?? 0), 0) / count
        : 0;
    const dist = [0, 0, 0, 0, 0];
    for (const r of rows) {
      const idx = Math.min(4, Math.max(0, Math.round(r.rating) - 1));
      dist[idx] += 1;
    }
    return { count, avg, dist };
  }, [rows]);

  const updateMutation = useMutation({
    mutationFn: async (vars: { id: string; rating: number; comment: string }) => {
      const res = await api.patch(`/reviews/${vars.id}`, {
        rating: vars.rating,
        comment: vars.comment,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Review updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Failed to update review");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/reviews/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Failed to delete review");
    },
  });

  function startEdit(r: ReviewRow) {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment ?? "");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-cyan-400/10 to-sky-400/5 px-6 py-10 md:px-10 md:py-14">
          <div className="hero-overlay absolute inset-0 -z-10" />
          <div className="relative flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              My reviews
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl md:text-5xl font-bold tracking-tight"
            >
              Reviews{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                you left
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="max-w-xl text-sm md:text-base text-muted-foreground"
            >
              Edit or remove any review you have left for a technician.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-card p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total reviews
          </span>
          <div className="mt-3 text-2xl font-bold tracking-tight">
            {stats.count}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Average rating
          </span>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {stats.avg ? stats.avg.toFixed(1) : "—"}
            </span>
            <Stars value={stats.avg} />
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Rating distribution
          </span>
          <div className="mt-3 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const idx = star - 1;
              const count = stats.dist[idx] ?? 0;
              const pct =
                stats.count > 0 ? (count / stats.count) * 100 : 0;
              return (
                <div
                  key={star}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="w-6 text-muted-foreground">{star}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Search + refresh */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service, technician, or comment..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="gradient" size="sm">
            <Link href="/dashboard/reviews/new">
              <PencilLine className="h-4 w-4" />
              Write a review
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </section>

      {/* List */}
      <section>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border bg-card p-5 animate-pulse h-32"
              />
            ))}
          </div>
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
          <Empty />
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => (
              <ReviewItem
                key={r.id}
                review={r}
                isEditing={editingId === r.id}
                editRating={editRating}
                editComment={editComment}
                onStartEdit={() => startEdit(r)}
                onCancelEdit={() => setEditingId(null)}
                onChangeRating={setEditRating}
                onChangeComment={setEditComment}
                onSave={() =>
                  updateMutation.mutate({
                    id: r.id,
                    rating: editRating,
                    comment: editComment,
                  })
                }
                saving={updateMutation.isPending}
                onAskDelete={() => setConfirmDeleteId(r.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {confirmDeleteId ? (
          <ConfirmDialog
            onCancel={() => setConfirmDeleteId(null)}
            onConfirm={() => deleteMutation.mutate(confirmDeleteId)}
            loading={deleteMutation.isPending}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Components ---------- */

function ReviewItem({
  review,
  isEditing,
  editRating,
  editComment,
  onStartEdit,
  onCancelEdit,
  onChangeRating,
  onChangeComment,
  onSave,
  saving,
  onAskDelete,
}: {
  review: ReviewRow;
  isEditing: boolean;
  editRating: number;
  editComment: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeRating: (n: number) => void;
  onChangeComment: (s: string) => void;
  onSave: () => void;
  saving: boolean;
  onAskDelete: () => void;
}) {
  const tech = review.technician?.user?.name ?? "Technician";
  const date = toDate(review.createdAt);

  return (
    <li className="rounded-2xl border bg-card p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white flex items-center justify-center font-semibold">
          {tech?.charAt(0)?.toUpperCase() ?? "T"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold tracking-tight truncate">
              {review.service?.title ?? "Service"}
            </h3>
            <Badge variant="secondary" className="text-[10px]">
              {tech}
            </Badge>
          </div>
          {date ? (
            <p className="text-xs text-muted-foreground">
              {safeFormatDate(review.createdAt, "—", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          ) : null}

          {!isEditing ? (
            <>
              <div className="mt-2">
                <Stars value={review.rating} />
              </div>
              {review.comment ? (
                <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">
                  {review.comment}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-muted-foreground">
                  No comment
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStartEdit}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600 hover:text-rose-700"
                  onClick={onAskDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const v = i + 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onChangeRating(v)}
                      className="p-1"
                      aria-label={`Rate ${v} stars`}
                    >
                      <Star
                        className={cn(
                          "h-5 w-5 transition",
                          v <= editRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground hover:text-amber-300"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <Textarea
                rows={3}
                value={editComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onChangeComment(e.target.value)
                }
                placeholder="Share details about your experience..."
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              filled
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            )}
          />
        );
      })}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageSquareText className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">No reviews yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        After a completed booking, you can leave a review for the technician.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/dashboard/bookings">Go to bookings</Link>
      </Button>
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
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
      <AlertCircle className="h-6 w-6 text-destructive" />
      <p className="font-semibold text-destructive">
        Couldn&apos;t load reviews
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
        Try again
      </Button>
    </div>
  );
}

function ConfirmDialog({
  onCancel,
  onConfirm,
  loading,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Trash2 className="h-6 w-6" />
        </div>
        <h3 className="text-center font-semibold">Delete this review?</h3>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          This action cannot be undone.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
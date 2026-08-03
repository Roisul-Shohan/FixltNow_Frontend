"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Send,
  Star,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess, Booking, Review } from "@/types";

/**
 * Page: /dashboard/reviews/new
 * Lets a customer pick a completed booking and write a review for it.
 * Submits via POST /api/reviews with { bookingId, rating, comment? }.
 */
export default function WriteReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBookingId = searchParams.get("bookingId") || "";
  const queryClient = useQueryClient();

  const [bookingId, setBookingId] = useState(preselectedBookingId);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  // Fetch customer's bookings to surface reviewable ones
  const { data, isLoading } = useQuery<ApiSuccess<Booking[]>>({
    queryKey: ["reviewable-bookings"],
    queryFn: async () => (await api.get("/bookings/me?limit=100")).data,
  });

  const allBookings = data?.data ?? [];

  // Filter to bookings that are eligible for reviews: COMPLETED
  // and don't already have a review.
  const eligible = useMemo(
    () => allBookings.filter((b) => b.status === "COMPLETED"),
    [allBookings]
  );

  const selected = useMemo(
    () => eligible.find((b) => b.id === bookingId),
    [eligible, bookingId]
  );

  // If ?bookingId= was provided but the booking isn't reviewable, warn.
  useEffect(() => {
    if (preselectedBookingId && !isLoading && !selected) {
      const stillExists = allBookings.find((b) => b.id === preselectedBookingId);
      if (stillExists && stillExists.review) {
        toast.info("You've already reviewed this booking.");
      } else if (stillExists) {
        toast.info("This booking isn't completed yet.");
      }
    }
  }, [preselectedBookingId, selected, allBookings, isLoading]);

  const createMutation = useMutation({
    mutationFn: async (payload: { bookingId: string; rating: number; comment?: string }) =>
      (await api.post("/reviews", payload)).data as ApiSuccess<Review>,
    onSuccess: () => {
      toast.success("Review submitted — thanks for your feedback!");
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviewable-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push("/dashboard/reviews");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Couldn't submit your review. Try again.";
      toast.error(msg);
    },
  });

  const canSubmit =
    bookingId && rating >= 1 && !createMutation.isPending && !selected?.review;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    createMutation.mutate({
      bookingId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <div className="py-8 md:py-12 max-w-3xl mx-auto">
      <div className="text-xs text-muted-foreground mb-3">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/dashboard/reviews" className="hover:text-foreground transition-colors">
          Reviews
        </Link>
        <span className="mx-1.5">/</span>
        <span>New</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Star className="h-3.5 w-3.5" />
          Write a review
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
          Share your experience
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-lg">
          Pick a completed booking, rate the technician, and tell other customers
          how it went.
        </p>
      </motion.div>

      <form
        onSubmit={onSubmit}
        className="card-premium card-halo p-5 sm:p-6 space-y-6"
      >
        {/* Booking picker */}
        <section>
          <label className="block text-sm font-semibold mb-2">
            Which booking?
          </label>
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : eligible.length === 0 ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              You don{"’"}t have any completed bookings yet. Once a technician finishes
              a job, you{"’"}ll be able to leave a review here.
            </div>
          ) : (
            <select
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="w-full h-11 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select a completed booking —</option>
              {eligible.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.service?.title || "Service"} ·{" "}
                  {b.technician?.user?.name || "Technician"} ·{" "}
                  {formatDate(b.bookingDate)}
                </option>
              ))}
            </select>
          )}

          {selected ? (
            <div className="mt-3 rounded-lg border bg-muted/30 p-3 text-sm flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Wrench className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {selected.service?.title || "Service"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selected.technician?.user?.name || "Technician"} ·{" "}
                  {formatDate(selected.bookingDate)}
                  {selected.startTime && selected.endTime
                    ? ` · ${formatTime(selected.startTime)} – ${formatTime(selected.endTime)}`
                    : null}
                </p>
              </div>
              {selected.review ? (
                <Badge variant="success">Already reviewed</Badge>
              ) : (
                <Badge variant="info">Awaiting review</Badge>
              )}
            </div>
          ) : null}
        </section>

        {/* Star rating */}
        <section>
          <label className="block text-sm font-semibold mb-2">
            Your rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hover || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                  className="p-1 rounded-md transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-9 w-9 transition-colors",
                      filled
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating ? `${rating} / 5` : "Tap a star"}
            </span>
          </div>
        </section>

        {/* Comment */}
        <section>
          <label className="block text-sm font-semibold mb-2">
            Comments <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            value={comment}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setComment(e.target.value.slice(0, 500))
            }
            placeholder="Tell us what went well, or what could be better…"
            rows={5}
            maxLength={500}
          />
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {comment.length} / 500
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            disabled={!canSubmit}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit review
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

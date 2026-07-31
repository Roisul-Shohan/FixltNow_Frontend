"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Sparkles, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { TechnicianCard } from "@/components/technicians/technician-card";
import { TechniciansFilters } from "@/components/technicians/filters-bar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess, TechnicianProfile } from "@/types";

function TechniciansBrowser() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const rating = sp.get("rating") ?? "";
  const experience = sp.get("experience") ?? "";
  const sort = sp.get("sort") ?? "-averageRating";

  const params = new URLSearchParams();
  if (q) params.set("searchTerm", q);
  if (rating) params.set("rating", rating);
  if (experience) params.set("yearsOfExperience", experience);
  if (sort) {
    const [field, order] = sort.startsWith("-")
      ? [sort.slice(1), "desc"]
      : [sort, "asc"];
    params.set("sortBy", field);
    params.set("sortOrder", order);
  }
  params.set("limit", "24");

  const {
    data: techRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ApiSuccess<TechnicianProfile[]>>({
    queryKey: ["technicians", params.toString()],
    queryFn: async () => {
      const res = await api.get(`/technicians?${params.toString()}`);
      return res.data;
    },
  });

  const list: TechnicianProfile[] = techRes?.data ?? [];
  const total = techRes?.meta?.total ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <aside className="lg:sticky lg:top-20 self-start">
        <TechniciansFilters total={total} />
      </aside>

      <section className="min-h-[40vh]">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">
                Failed to load technicians
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {(error as Error)?.message ||
                  "Network error. Please check your connection."}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center space-y-2">
            <Users className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="font-semibold">No technicians match your filters</h2>
            <p className="text-sm text-muted-foreground">
              Try widening your search or clearing filters above.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch"
          >
            {list.map((tech, i) => (
              <TechnicianCard key={tech.id} technician={tech} index={i} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}

export default function TechniciansPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-cyan-400/10 to-sky-400/5 p-8 md:p-12"
      >
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Vetted home-service professionals
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight inline-flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            Meet our technicians
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Browse FixItNow&apos;s trusted electricians, plumbers, carpenters and
            more. Filter by experience and rating to find the right pro for
            your home.
          </p>
        </div>
      </motion.section>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="lg:sticky lg:top-20 self-start">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </aside>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        }
      >
        <TechniciansBrowser />
      </Suspense>
    </div>
  );
}
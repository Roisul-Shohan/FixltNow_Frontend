"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Sparkles, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { TechnicianCard } from "@/components/technicians/technician-card";
import { TechniciansFilters } from "@/components/technicians/filters-bar";
import { SearchStrip } from "@/components/public/search-strip";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
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
      <aside className="lg:sticky lg:top-20 self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-1 lg:-mr-1">
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
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <section className="relative isolate overflow-hidden">
        <div className="lightrays-wrap">
          <div className="lightrays-wrap" />
        </div>
        <div className="hero-overlay absolute inset-0" />
        <div className="container relative z-10 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Vetted home-service professionals
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mt-4 text-3xl md:text-5xl font-bold tracking-tight"
          >
            Meet our{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
              technicians
            </span>
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-3 text-muted-foreground max-w-xl mx-auto"
          >
            Browse FixItNow&apos;s trusted electricians, plumbers, carpenters and
            more. Filter by experience and rating to find the right pro for your
            home.
          </motion.p>
        </div>
      </section>

      <SearchStrip
        basePath="/technicians"
        placeholder="Search technicians by name or specialty (e.g. plumber, AC repair)"
        hint="Try “plumber Dhaka”, “electrician Mirpur”, or a name."
      />

      <Suspense
        fallback={
          <div className="container mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="lg:sticky lg:top-20 self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-1 lg:-mr-1">
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-24 w-full" />
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

      <PublicFooter />
    </div>
  );
}

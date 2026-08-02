"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { SearchStrip } from "@/components/public/search-strip";
import { ServiceCard } from "@/components/services/service-card";
import { ServicesFilters } from "@/components/services/filters-bar";
import { EmptyState } from "@/components/services/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Category, Service, ApiSuccess } from "@/types";

function ServicesBrowser() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const category = sp.get("category") ?? "";
  const location = sp.get("location") ?? "";
  const rating = sp.get("rating") ?? "";
  const sort = sp.get("sort") ?? "-averageRating";

  const params = new URLSearchParams();
  if (q) params.set("searchTerm", q);
  if (category) params.set("category.name", category);
  if (location) params.set("location", location);
  if (rating) params.set("rating", rating);
  if (sort) {
    const [field, order] = sort.startsWith("-") ? [sort.slice(1), "desc"] : [sort, "asc"];
    params.set("sortBy", field);
    params.set("sortOrder", order);
  }
  params.set("limit", "12");

  const {
    data: servicesRes,
    isLoading: l1,
    isError,
    error,
    refetch,
  } = useQuery<ApiSuccess<Service[]>>({
    queryKey: ["services", params.toString()],
    queryFn: async () => {
      const res = await api.get(`/services?${params.toString()}`);
      return res.data;
    },
  });

  const { data: categoriesRes } = useQuery<ApiSuccess<Category[]>>({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const res = await api.get(`/categories?limit=100`);
      return res.data;
    },
  });

  const services = servicesRes?.data ?? [];
  const total = servicesRes?.meta?.total ?? 0;
  const categories = categoriesRes?.data ?? [];

  return (
    <section className="container py-8 md:py-12 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
      <aside className="md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-5rem)] md:overflow-y-auto md:pr-1 md:-mr-1">
        <ServicesFilters categories={categories} total={total} />
      </aside>

      <div>
        {l1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">Failed to load services</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(error as Error)?.message || "Network error. Please check your connection."}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : services.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <section className="relative isolate overflow-hidden">
        <div className="lightrays-wrap">
          <div className="lightrays-wrap" />
        </div>
        <div className="hero-overlay absolute inset-0" />
        <div className="container relative z-10 py-16 md:py-24 text-center">
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-3xl md:text-5xl font-bold tracking-tight"
          >
            Find the right{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
              service
            </span>
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-3 text-muted-foreground max-w-xl mx-auto"
          >
            Browse verified technicians offering transparent, hourly-rate services across Bangladesh.
          </motion.p>
        </div>
      </section>

      <SearchStrip
        basePath="/services"
        placeholder="Search services (e.g. plumbing, cleaning, AC repair)"
        hint="Try “ac repair Dhaka”, “plumber Mirpur”, or a category like “electrician”."
      />

      <Suspense
        fallback={
          <section className="container py-8 md:py-12 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
            <aside className="md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-5rem)] md:overflow-y-auto md:pr-1 md:-mr-1">
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </aside>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          </section>
        }
      >
        <ServicesBrowser />
      </Suspense>

      <PublicFooter />
    </div>
  );
}
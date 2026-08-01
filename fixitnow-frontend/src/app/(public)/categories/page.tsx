"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Droplet,
  Hammer,
  Layers,
  Search,
  Sparkles,
  Wrench,
  Wind,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess, Category, Service } from "@/types";

const iconMap: Record<string, typeof Wrench> = {
  Plumbing: Droplet,
  Electrical: Zap,
  Cleaning: Sparkles,
  "AC Repair": Wind,
  Carpentry: Hammer,
  Mechanical: Wrench,
};

function CategoryCard({
  category,
  count,
  index,
}: {
  category: Category;
  count: number;
  index: number;
}) {
  const Icon = iconMap[category.name] ?? Wrench;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        href={`/services?category=${encodeURIComponent(category.name)}`}
        className="group block h-full"
        aria-label={`Browse services in ${category.name}`}
      >
        <Card className="h-full cursor-pointer transition-all group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/10">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 transition-transform group-hover:scale-110">
              <Icon className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-base">{category.name}</h3>
            {category.description ? (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {category.description}
              </p>
            ) : null}
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <Layers className="h-3 w-3" />
              <span>
                {count} service{count === 1 ? "" : "s"}
              </span>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Browse <ArrowRight className="h-3 w-3" />
            </span>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function CategoriesBrowser() {
  const [query, setQuery] = useState("");

  // Fetch every active category. limit=100 is well above the realistic max;
  // the backend caps response size.
  const {
    data: categoriesRes,
    isLoading: l1,
    isError,
    error,
    refetch,
  } = useQuery<ApiSuccess<Category[]>>({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const res = await api.get(`/categories?limit=100`);
      return res.data;
    },
  });

  // Fetch all services in one shot so we can derive a count per category name.
  // limit=100 covers the seeded dataset; if more arrive we can swap this for
  // a per-category count endpoint later.
  const { data: servicesRes, isLoading: l2 } = useQuery<ApiSuccess<Service[]>>(
    {
      queryKey: ["services-all-for-category-counts"],
      queryFn: async () => {
        const res = await api.get(`/services?limit=100`);
        return res.data;
      },
    }
  );

  const categories = categoriesRes?.data ?? [];
  const services = servicesRes?.data ?? [];

  const countByCategoryName = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of services) {
      const name = s.category?.name;
      if (!name) continue;
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return map;
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      if (c.name?.toLowerCase().includes(q)) return true;
      if (c.description?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [categories, query]);

  return (
    <section className="container py-8 md:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {l1
              ? "Loading categories…"
              : `${filtered.length} of ${categories.length} categor${
                  categories.length === 1 ? "y" : "ies"
                }`}
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="pl-9"
          />
        </div>
      </div>

      {l1 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3 max-w-xl mx-auto">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">
              Failed to load categories
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message || "Network error. Please try again."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-sm font-medium text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="mt-3 font-semibold">No categories match your search</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different keyword or browse all categories.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map((c, i) => (
            <CategoryCard
              key={c.id}
              category={c}
              count={
                // Fall back to 0 while the services query is still loading so
                // the card doesn't briefly show a wrong number.
                l2 ? 0 : countByCategoryName.get(c.name) ?? 0
              }
              index={i}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Service counts refresh from{" "}
        <Link
          href="/services"
          className="text-primary hover:underline font-medium"
        >
          /services
        </Link>
        .
      </p>
    </section>
  );
}

export default function CategoriesPage() {
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
            Browse all{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
              categories
            </span>
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-3 text-muted-foreground max-w-xl mx-auto"
          >
            Pick the type of work you need and we&apos;ll match you with
            verified technicians in your area.
          </motion.p>
        </div>
      </section>

      <Suspense
        fallback={
          <section className="container py-8 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </section>
        }
      >
        <CategoriesBrowser />
      </Suspense>

      <PublicFooter />
    </div>
  );
}
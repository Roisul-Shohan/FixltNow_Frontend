"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types";

export function ServicesFilters({
  categories,
  total,
}: {
  categories: Category[];
  total: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const initialQ = sp.get("q") ?? "";
  const initialCat = sp.get("category") ?? "";
  const initialLoc = sp.get("location") ?? "";
  const initialRating = sp.get("rating") ?? "";
  const initialSort = sp.get("sort") ?? "-averageRating";

  // Local state for the location input. Driven by URL on mount, then debounced
  // into the URL as the user types.
  const [loc, setLoc] = useState(initialLoc);

  // Re-sync local state when the URL changes from outside (e.g. clicking
  // "clear all" or chips).
  useEffect(() => {
    setLoc(initialLoc);
  }, [initialLoc]);

  // Build a URL from a delta of updates. Always drops `page` because any
  // filter change resets pagination.
  const push = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(sp.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (!v) params.delete(k);
        else params.set(k, v);
      });
      params.delete("page");
      router.push(`/services?${params.toString()}`);
    },
    [router, sp]
  );

  // Debounce helper for the location input.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedPush = useCallback(
    (next: Record<string, string | undefined>, delay = 400) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => push(next), delay);
    },
    [push]
  );

  // Live location filter — fires as the user types.
  useEffect(() => {
    const trimmed = loc.trim();
    if (trimmed === initialLoc) return;
    debouncedPush({ location: trimmed || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const clearAll = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoc("");
    router.push("/services");
  };

  const active = [
    initialQ && { k: "q", label: `“${initialQ}”` },
    initialCat && {
      k: "category",
      // The URL value is the category name (backend filters on category.name).
      label:
        categories.find((c) => c.name === initialCat)?.name ?? initialCat,
    },
    initialLoc && { k: "location", label: initialLoc },
    initialRating && { k: "rating", label: `${initialRating}★ & up` },
  ].filter(Boolean) as Array<{ k: string; label: string }>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => push({ category: undefined })}
            className={`text-xs rounded-full border px-3 py-1 transition-colors ${
              !initialCat
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background hover:border-primary"
            }`}
          >
            All
          </button>
          {categories.map((c) => {
            // Use the category name as the URL value because the backend
            // filter field is `category.name` and slugs are not generated.
            const value = c.name;
            const active = initialCat === value;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => push({ category: active ? undefined : value })}
                className={`text-xs rounded-full border px-3 py-1 transition-colors ${
                  active
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background hover:border-primary"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Location</h3>
        <div className="relative">
          <Input
            placeholder="City or area"
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            className="pr-8"
          />
          {loc && (
            <button
              type="button"
              onClick={() => setLoc("")}
              aria-label="clear location"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Filters as you type.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Minimum rating</h3>
        <div className="flex flex-wrap gap-1">
          {[4.5, 4, 3.5, 3].map((r) => {
            const active = initialRating === String(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => push({ rating: active ? undefined : String(r) })}
                className={`text-xs rounded-full border px-3 py-1 transition-colors ${
                  active
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background hover:border-primary"
                }`}
              >
                {r}★+
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Sort by</h3>
        <select
          value={initialSort}
          onChange={(e) => push({ sort: e.target.value })}
          className="w-full h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="-averageRating">Rating: high to low</option>
          <option value="hourlyRate">Price: low to high</option>
          <option value="-hourlyRate">Price: high to low</option>
          <option value="-createdAt">Newest</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> services found
        </p>
        {active.length ? (
          <div className="flex items-center gap-2 flex-wrap">
            {active.map((a) => (
              <button
                key={a.k}
                type="button"
                onClick={() => {
                  if (a.k === "location") setLoc("");
                  push({ [a.k]: undefined });
                }}
                className="group"
              >
                <Badge variant="secondary" className="gap-1 cursor-pointer">
                  {a.label}
                  <X className="h-3 w-3 group-hover:text-destructive" />
                </Badge>
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

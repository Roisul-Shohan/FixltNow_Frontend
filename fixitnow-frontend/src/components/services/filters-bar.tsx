"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  const [q, setQ] = useState(initialQ);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    push({ q: q.trim() || undefined });
  };

  const clearAll = () => router.push("/services");

  const active = [
    initialQ && { k: "q", label: `“${initialQ}”` },
    initialCat && {
      k: "category",
      label: categories.find((c) => (c.slug ?? c.id) === initialCat)?.name ?? initialCat,
    },
    initialLoc && { k: "location", label: initialLoc },
    initialRating && { k: "rating", label: `${initialRating}★ & up` },
  ].filter(Boolean) as Array<{ k: string; label: string }>;

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-xl border bg-card p-1.5 shadow-sm"
      >
        <div className="flex items-center flex-1 px-2">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search services (e.g. plumbing, cleaning)"
            className="border-0 shadow-none focus-visible:ring-0 h-10 px-0"
          />
        </div>
        <Button type="submit" size="sm" variant="gradient" className="rounded-lg">
          Search
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
          aria-label="filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>

      <div className={`${open ? "block" : "hidden"} md:block space-y-4`}>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Categories</h3>
          </div>
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
              const value = c.slug ?? c.id;
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
          <Input
            placeholder="City or area"
            defaultValue={initialLoc}
            onBlur={(e) => push({ location: e.target.value.trim() || undefined })}
          />
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
                onClick={() => push({ [a.k]: undefined })}
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

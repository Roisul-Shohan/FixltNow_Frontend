"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function TechniciansFilters({ total }: { total: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const initialQ = sp.get("q") ?? "";
  const initialRating = sp.get("rating") ?? "";
  const initialExperience = sp.get("experience") ?? "";
  const initialSort = sp.get("sort") ?? "-averageRating";

  const push = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(sp.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (!v) params.delete(k);
        else params.set(k, v);
      });
      params.delete("page");
      router.push(`/technicians?${params.toString()}`);
    },
    [router, sp]
  );

  const clearAll = () => {
    router.push("/technicians");
  };

  const active = [
    initialQ && { k: "q", label: `“${initialQ}”` },
    initialRating && { k: "rating", label: `${initialRating}★ & up` },
    initialExperience && {
      k: "experience",
      label: `${initialExperience}+ years`,
    },
  ].filter(Boolean) as Array<{ k: string; label: string }>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Minimum rating</h3>
        <div className="flex flex-wrap gap-1">
          {[4.5, 4, 3.5, 3].map((r) => {
            const active = initialRating === String(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() =>
                  push({ rating: active ? undefined : String(r) })
                }
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
        <h3 className="font-semibold text-sm">Experience</h3>
        <div className="flex flex-wrap gap-1">
          {[10, 5, 3, 1].map((y) => {
            const active = initialExperience === String(y);
            return (
              <button
                key={y}
                type="button"
                onClick={() =>
                  push({ experience: active ? undefined : String(y) })
                }
                className={`text-xs rounded-full border px-3 py-1 transition-colors ${
                  active
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background hover:border-primary"
                }`}
              >
                {y}+ yrs
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
          <option value="-yearsOfExperience">Most experienced</option>
          <option value="-totalReviews">Most reviewed</option>
          <option value="-createdAt">Newest</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span>{" "}
          technicians found
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
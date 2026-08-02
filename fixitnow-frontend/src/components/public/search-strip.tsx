"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchStripProps {
  /** URL path the form posts to (pushes the search query onto this route). */
  basePath: string;
  /** Placeholder text for the input. */
  placeholder: string;
  /** Optional preselected category shown as a small chip in the strip. */
  hint?: string;
  /** Optional className for the outer wrapper. */
  className?: string;
}

/**
 * Centered, prominent "middle upper" search bar. Lives between the hero and
 * the listing grid on /services and /technicians. Writes the query to the
 * `q` URL param, which the listing browser reads via useSearchParams.
 */
export function SearchStrip({
  basePath,
  placeholder,
  hint,
  className,
}: SearchStripProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const initialQ = sp.get("q") ?? "";

  const [q, setQ] = useState(initialQ);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Re-sync local input when the URL changes externally (e.g. clear-all).
  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  // Build a URL from a delta of updates. Always drops `page` because any
  // filter change resets pagination.
  const pushUrl = (next: string | undefined) => {
    const params = new URLSearchParams(sp.toString());
    if (!next) params.delete("q");
    else params.set("q", next);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  };

  // Debounced push — fires as the user types.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed === initialQ) return;
    setPending(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushUrl(trimmed || undefined);
      setPending(false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPending(false);
    pushUrl(q.trim() || undefined);
    inputRef.current?.blur();
  };

  const onClear = () => {
    setQ("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPending(false);
    pushUrl(undefined);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={cn(
        "container relative z-20 -mt-10 md:-mt-14",
        className
      )}
    >
      <form
        onSubmit={onSubmit}
        role="search"
        aria-label="Search"
        className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border bg-card/95 p-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80"
      >
        <div className="flex flex-1 items-center px-3">
          <Search className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
          <Input
            ref={inputRef}
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
          />
          {pending && (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin ml-2 shrink-0" />
          )}
          {q && !pending && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={onClear}
              className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          variant="gradient"
          className="rounded-xl h-12 px-5"
        >
          Search
        </Button>
      </form>
      {hint ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </motion.div>
  );
}

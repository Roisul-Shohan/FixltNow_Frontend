"use client";

import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-background via-background to-muted/40 px-4 py-16 sm:py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Wrench className="h-8 w-8" aria-hidden />
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
          404 — Page not found
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
          We couldn&rsquo;t find that service.
        </h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          The page you&rsquo;re looking for may have been moved, deleted, or
          never existed. Head back to the homepage and pick from our verified
          technicians.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/services">Browse services</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

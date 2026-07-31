"use client";
import Link from "next/link";
import { Frown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title = "No services match your filters",
  description = "Try removing a filter or searching for a different keyword.",
  action = { label: "Clear filters", href: "/services" },
}: {
  title?: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl border border-dashed bg-muted/20">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
        <Frown className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      <Button asChild variant="outline" className="mt-4">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </div>
  );
}
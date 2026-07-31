"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Star, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBDT } from "@/lib/utils";
import type { Service } from "@/types";

export function ServiceCard({ service, index = 0 }: { service: Service; index?: number }) {
  // API returns technician as { id, bio, ..., user: { name, profileImage } }
  // but our existing Technician type keeps a flat `name`. Read both shapes so
  // the card never renders blank when the type/runtime diverge.
  const tech = service.technician as
    | (typeof service.technician & { user?: { name?: string } })
    | undefined;
  const techName =
    (tech as any)?.user?.name ?? (tech as any)?.name ?? "";
  const techInitial = techName ? techName.charAt(0).toUpperCase() : "?";
  const category = service.category;
  const rating = service.averageRating ?? 0;
  const reviews = service.totalReviews ?? 0;
  const hasRating = rating > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link href={`/services/${service.id}`} className="block h-full">
        <Card className="h-full overflow-hidden cursor-pointer group flex flex-col">
          <div className="relative h-28 shrink-0 bg-gradient-to-br from-primary/20 via-cyan-400/20 to-sky-400/20">
            <div className="absolute inset-0 flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform duration-500">
              <Wrench className="h-12 w-12" />
            </div>
            {category?.name ? (
              <Badge className="absolute top-3 left-3" variant="info">
                {category.name}
              </Badge>
            ) : null}
            {hasRating && rating >= 4.5 ? (
              <Badge className="absolute top-3 right-3" variant="success">
                Top Rated
              </Badge>
            ) : null}
          </div>

          <CardContent className="p-5 flex flex-col gap-3 grow">
            <div>
              <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
                {service.description}
              </p>
            </div>

            <div className="mt-auto pt-3 border-t space-y-3">
              {techName ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-[10px] font-semibold">
                    {techInitial}
                  </span>
                  <span className="line-clamp-1">by {techName}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-1">
                  <Star className={`h-3.5 w-3.5 ${hasRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  <span className="font-semibold text-foreground">
                    {hasRating ? rating.toFixed(1) : "New"}
                  </span>
                  <span className="text-muted-foreground">({reviews})</span>
                </div>
                {service.location ? (
                  <div className="inline-flex items-center gap-1 text-muted-foreground min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[140px]">{service.location}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="inline-flex items-baseline gap-1 rounded-md bg-primary/10 px-2 py-1">
                  <span className="text-base font-bold text-primary leading-none">
                    {formatBDT(service.hourlyRate)}
                  </span>
                  <span className="text-[11px] font-medium text-primary/70 leading-none">
                    /hr
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-90 group-hover:opacity-100 group-hover:gap-1.5 transition-all shrink-0">
                  View details
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

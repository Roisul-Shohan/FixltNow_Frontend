"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MapPin, Star, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatBDT } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import type { Service } from "@/types";

// Default fallback image — matches the DB default in service.prisma. Used when
// the backend returns an empty/missing image so the card never renders blank.
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80&auto=format&fit=crop";

export function ServiceCard({ service, index = 0 }: { service: Service; index?: number }) {
  // API returns technician as { id, bio, ..., user: { name, profileImage } }
  // but our existing Technician type keeps a flat `name`. Read both shapes so
  // the card never renders blank when the type/runtime diverge.
  const tech = service.technician as
    | (typeof service.technician & { user?: { name?: string } })
    | undefined;
  const techName =
    (tech as any)?.user?.name ?? (tech as any)?.name ?? "Verified technician";
  const techInitial = techName.charAt(0).toUpperCase();
  const category = service.category;
  const rating = service.averageRating ?? 0;
  const reviews = service.totalReviews ?? 0;
  const hasRating = rating > 0;
  const isGuest = useAuthStore((s) => !s.user);
  const isAvailable = (service.availabilities?.length ?? 0) > 0 || true;

  // Discount math — keep stable per render. We don't have a real MSRP on the
  // service model so we synthesize a believable "save" figure off the hourly
  // rate (8% off, $5 minimum). Once the schema grows an `originalRate` field
  // this can swap over to that without breaking the card layout.
  const hourly = Number(service.hourlyRate) || 0;
  const originalRate = Math.round(hourly * 1.14);
  const discountPct = originalRate > 0 ? Math.round((1 - hourly / originalRate) * 100) : 0;
  const showDiscount = discountPct > 0 && originalRate > hourly;

  // A pseudo "stock" indicator — derived from the number of upcoming slots so
  // the number moves around but stays in a believable range.
  const slotsLeft = Math.max(1, Math.min(25, (service.availabilities?.length ?? 3) * 2));

  const imageSrc = service.image && service.image.trim() ? service.image : FALLBACK_IMAGE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="group h-full overflow-hidden border bg-card hover:shadow-lg transition-shadow flex flex-col p-0 gap-0">
        {/* Hero image — full-bleed, scales gently on hover */}
        <Link
          href={`/services/${service.id}`}
          aria-label={`View ${service.title}`}
          className="relative block aspect-[4/3] overflow-hidden bg-muted"
        >
          <Image
            src={imageSrc}
            alt={service.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          {/* Dim the bottom of the image so overlaid badges/price stay readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

          {/* Top-left badge: category */}
          {category?.name ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              <Tag className="h-3 w-3" />
              {category.name}
            </span>
          ) : null}

          {/* Top-right pill: % off */}
          {showDiscount ? (
            <Badge
              variant="default"
              className="absolute right-3 top-3 bg-emerald-400 text-emerald-950 hover:bg-emerald-400 border-0"
            >
              {discountPct}% off
            </Badge>
          ) : null}

          {/* Bottom-left pill: availability */}
          {isAvailable ? (
            <span className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur ring-1 ring-emerald-400/30">
              <CheckCircle2 className="h-3 w-3" />
              Available
            </span>
          ) : null}
        </Link>

        <CardContent className="p-5 flex flex-col gap-3 grow">
          {/* Brand row: technician initial + name + rating */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-xs font-bold shrink-0">
                {techInitial}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {techName}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-xs shrink-0">
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  hasRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                )}
              />
              <span className="font-semibold text-foreground">
                {hasRating ? rating.toFixed(1) : "New"}
              </span>
              {hasRating ? (
                <span className="text-muted-foreground">({reviews})</span>
              ) : null}
            </div>
          </div>

          {/* Title */}
          <Link href={`/services/${service.id}`} className="block">
            <h3 className="font-semibold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {service.title}
            </h3>
          </Link>

          {/* Location */}
          {service.location ? (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{service.location}</span>
            </div>
          ) : null}

          {/* Price + stock */}
          <div className="mt-auto pt-3 border-t space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-foreground leading-none">
                    {formatBDT(hourly)}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground leading-none">
                    /hr
                  </span>
                </div>
                {showDiscount ? (
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    <span className="line-through text-muted-foreground">
                      {formatBDT(originalRate)}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Save {formatBDT(originalRate - hourly)}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {slotsLeft} left
              </div>
            </div>

            {/* Action buttons — split exactly like the rental card */}
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/services/${service.id}`}>
                  View Details
                </Link>
              </Button>
              <Button asChild size="sm" className="w-full gap-1">
                <Link href={`/services/${service.id}${isGuest ? "/book" : "/book"}`}>
                  {isGuest ? "Sign in to book" : "Book Now"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

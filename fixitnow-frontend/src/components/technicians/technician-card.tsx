"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Star, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TechnicianProfile } from "@/types";

export function TechnicianCard({
  technician,
  index = 0,
}: {
  technician: TechnicianProfile;
  index?: number;
}) {
  const name = technician.user?.name ?? "Technician";
  const initial = name.charAt(0).toUpperCase();
  const avatar = technician.user?.profileImage;
  const bio = technician.bio ?? "";
  const years = technician.yearsOfExperience ?? 0;
  const rating = technician.averageRating ?? 0;
  const totalReviews = technician.totalReviews ?? 0;
  const hasRating = rating > 0;
  const services = technician.service ?? [];
  const serviceCount = services.length;
  const categories = Array.from(
    new Set(services.map((s) => s.category?.name).filter(Boolean) as string[])
  ).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        href={`/technicians/${technician.id}`}
        className="block h-full"
        aria-label={`View profile of ${name}`}
      >
        <Card className="h-full overflow-hidden cursor-pointer group flex flex-col">
          <div className="relative h-28 shrink-0 bg-gradient-to-br from-primary/20 via-cyan-400/20 to-sky-400/20">
            <div className="absolute inset-0 flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform duration-500">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Wrench className="h-12 w-12" />
              )}
            </div>
            {years >= 10 ? (
              <Badge className="absolute top-3 left-3" variant="success">
                Veteran
              </Badge>
            ) : null}
            {hasRating && rating >= 4.5 ? (
              <Badge className="absolute top-3 right-3" variant="info">
                Top Rated
              </Badge>
            ) : null}
          </div>

          <CardContent className="p-5 flex flex-col gap-3 grow">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-sm font-semibold">
                {initial}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                  {name}
                </h3>
                {years > 0 ? (
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {years}+ years experience
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">New technician</p>
                )}
              </div>
            </div>

            {bio ? (
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic min-h-[2.5rem]">
                Verified FixItNow professional.
              </p>
            )}

            <div className="mt-auto pt-3 border-t space-y-3">
              {categories.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <Badge key={c} variant="secondary" className="text-[10px]">
                      {c}
                    </Badge>
                  ))}
                  {serviceCount > categories.length ? (
                    <Badge variant="outline" className="text-[10px]">
                      +{serviceCount - categories.length} more
                    </Badge>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-1">
                  <Star
                    className={`h-3.5 w-3.5 ${
                      hasRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                    }`}
                  />
                  <span className="font-semibold text-foreground">
                    {hasRating ? rating.toFixed(1) : "New"}
                  </span>
                  <span className="text-muted-foreground">({totalReviews})</span>
                </div>
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>
                    {serviceCount} {serviceCount === 1 ? "service" : "services"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-90 group-hover:opacity-100 group-hover:gap-1.5 transition-all shrink-0">
                  View profile
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
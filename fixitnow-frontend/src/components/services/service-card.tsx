"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Star, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBDT } from "@/lib/utils";
import type { Service } from "@/types";

export function ServiceCard({ service, index = 0 }: { service: Service; index?: number }) {
  const tech = service.technician;
  const category = service.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link href={`/services/${service.id}`} className="block h-full">
        <Card className="h-full overflow-hidden cursor-pointer group">
          <div className="relative h-32 bg-gradient-to-br from-primary/20 via-cyan-400/20 to-sky-400/20">
            <div className="absolute inset-0 flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform duration-500">
              <Wrench className="h-12 w-12" />
            </div>
            {category?.name ? (
              <Badge className="absolute top-3 left-3" variant="info">
                {category.name}
              </Badge>
            ) : null}
            {typeof service.averageRating === "number" && service.averageRating >= 4.5 ? (
              <Badge className="absolute top-3 right-3" variant="success">
                Top Rated
              </Badge>
            ) : null}
          </div>

          <CardContent className="p-5 flex flex-col gap-3 h-full">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
                {service.description}
              </p>
            </div>

            {tech?.name ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-[10px] font-semibold">
                  {tech.name.charAt(0).toUpperCase()}
                </span>
                <span className="line-clamp-1">by {tech.name}</span>
              </div>
            ) : null}

            <div className="mt-auto flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{service.averageRating?.toFixed(1) ?? "New"}</span>
                <span className="text-muted-foreground">
                  ({service.totalReviews ?? 0})
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">
                  {formatBDT(service.hourlyRate)}
                  <span className="text-xs text-muted-foreground font-normal">/hr</span>
                </div>
                {service.location ? (
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1 max-w-[120px]">{service.location}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wrench, Zap, Droplet, Sparkles, Wind, Hammer,
  ShieldCheck, Clock, Star, ArrowRight, Search, CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LightRays } from "@/components/light-rays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import type { Service, Category } from "@/types";
import { formatBDT } from "@/lib/utils";

const iconMap: Record<string, any> = {
  Plumbing: Droplet, Electrical: Zap, Cleaning: Sparkles, "AC Repair": Wind, Carpentry: Hammer,
};

export default function HomePage() {
  const { data: services, isLoading: l1 } = useQuery({
    queryKey: ["home-services"],
    queryFn: async () => (await api.get("/services?limit=6&sort=-averageRating")).data?.data ?? [],
  });
  const { data: categories, isLoading: l2 } = useQuery({
    queryKey: ["home-cats"],
    queryFn: async () => (await api.get("/categories")).data?.data ?? [],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <section className="relative isolate overflow-hidden">
        <div className="lightrays-wrap">
          <LightRays
            raysOrigin="top-center"
            raysColor="#22d3ee"
            raysSpeed={0.6}
            lightSpread={1.2}
            rayLength={1.8}
            followMouse
            mouseInfluence={0.15}
            noiseAmount={0.05}
            saturation={1}
          />
        </div>
        <div className="hero-overlay absolute inset-0" />
        <div className="container relative z-10 py-24 md:py-36 text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <Badge variant="info" className="mb-5 px-3 py-1">
              <Star className="h-3 w-3 mr-1" /> Trusted by 10,000+ households
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Home services,{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                on demand
              </span>
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Book verified technicians for plumbing, electrical, cleaning, AC repair and more. Fast, transparent, and secure payments.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-10 max-w-3xl mx-auto"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const q = fd.get("q")?.toString().trim();
                if (q) window.location.href = `/services?q=${encodeURIComponent(q)}`;
              }}
              className="flex flex-col sm:flex-row gap-2 rounded-2xl border bg-card/80 backdrop-blur p-2 shadow-xl shadow-primary/5"
            >
              <div className="flex items-center flex-1 px-3">
                <Search className="h-5 w-5 text-muted-foreground mr-2" />
                <Input
                  name="q"
                  placeholder="What do you need help with?"
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" variant="gradient" className="rounded-xl">
                Find Pros <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {["Plumbing", "AC Repair", "Cleaning", "Electrician"].map((t) => (
                <Link key={t} href={`/services?q=${t}`} className="rounded-full bg-card border px-3 py-1 hover:border-primary hover:text-primary transition-colors">
                  {t}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
          >
            <Trust icon={ShieldCheck} label="Verified Pros" />
            <Trust icon={Clock} label="On-Time Service" />
            <Trust icon={CheckCircle2} label="Money-Back Guarantee" />
            <Trust icon={Star} label="4.8/5 Avg Rating" />
          </motion.div>
        </div>
      </section>

      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Browse by category</h2>
            <p className="text-muted-foreground mt-2">Pick a service and book in seconds</p>
          </div>
          <Button asChild variant="ghost" className="hidden md:flex">
            <Link href="/categories">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {l2 ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)
            : ((categories as Category[]) ?? []).slice(0, 5).map((c) => {
                const Icon = iconMap[c.name] ?? Wrench;
                return (
                  <Link key={c.id} href={`/services?category=${c.slug ?? c.id}`}>
                    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
                      <Card className="h-full cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/10">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                            <Icon className="h-7 w-7" />
                          </div>
                          <h3 className="font-semibold">{c.name}</h3>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                );
              })}
        </div>
      </section>

      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Top-rated services</h2>
            <p className="text-muted-foreground mt-2">Highly rated by customers near you</p>
          </div>
          <Button asChild variant="ghost" className="hidden md:flex">
            <Link href="/services">See all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {l1 ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)
            : ((services as Service[]) ?? []).map((s) => (
                <Link key={s.id} href={`/services/${s.id}`}>
                  <Card className="h-full overflow-hidden cursor-pointer group">
                    <div className="h-32 bg-gradient-to-br from-primary/20 via-cyan-400/20 to-sky-400/20 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform duration-500">
                        <Wrench className="h-12 w-12" />
                      </div>
                      <Badge className="absolute top-3 left-3" variant="info">{s.category?.name ?? "Service"}</Badge>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{s.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{s.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{s.averageRating?.toFixed(1) ?? "New"}</span>
                          <span className="text-muted-foreground">({s.totalReviews ?? 0})</span>
                        </div>
                        <span className="font-bold">{formatBDT(s.hourlyRate)}<span className="text-xs text-muted-foreground font-normal">/hr</span></span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-cyan-500 to-sky-500 p-12 md:p-16 text-white shadow-2xl shadow-primary/20">
          <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold">Are you a skilled technician?</h2>
            <p className="mt-4 text-lg text-white/90">
              Join hundreds of pros earning a full-time income on FixItNow. Get jobs, set your schedule, and grow your business.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="secondary" size="xl">
                <Link href="/register?role=TECHNICIAN">Become a Pro <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function Trust({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}
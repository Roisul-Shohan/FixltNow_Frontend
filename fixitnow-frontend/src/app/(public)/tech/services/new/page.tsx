"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Loader2,
  MapPin,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ----------------------- Constants ----------------------- */

const DEFAULT_SERVICE_IMAGE =
  "https://www.magnific.com/free-photos-vectors/electrical-instrument";

/* ----------------------- Types ----------------------- */

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface Category {
  id: string;
  name: string;
}

interface CategoryPayload {
  data: Category[];
}

interface FormState {
  title: string;
  description: string;
  categoryId: string;
  location: string;
  hourlyRate: string; // string for input handling
  image: string;
}

const INITIAL: FormState = {
  title: "",
  description: "",
  categoryId: "",
  location: "",
  hourlyRate: "",
  image: DEFAULT_SERVICE_IMAGE,
};

/* ----------------------- Page ----------------------- */

export default function NewServicePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {}
  );

  const {
    data: categoriesData,
    isLoading: catsLoading,
    isError: catsError,
    error: catsErr,
    refetch: refetchCats,
  } = useQuery<ApiSuccess<CategoryPayload["data"]>>({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data,
    staleTime: 5 * 60_000,
  });

  const categories: Category[] = useMemo(
    () => categoriesData?.data ?? [],
    [categoriesData?.data]
  );

  const createService = useMutation({
    mutationFn: async (body: {
      title: string;
      description?: string;
      categoryId: string;
      location: string;
      hourlyRate: number;
      image?: string;
    }) => {
      const res = await api.post("/services", body);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Service created");
      qc.invalidateQueries({ queryKey: ["tech-services"] });
      qc.invalidateQueries({ queryKey: ["technician-dashboard"] });
      router.push("/tech/services");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to create";
      toast.error(msg);
    },
  });

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.title.trim().length < 3)
      next.title = "Title must be at least 3 characters";
    if (!form.categoryId) next.categoryId = "Choose a category";
    if (form.location.trim().length < 2)
      next.location = "Location is required";
    const rate = Number(form.hourlyRate);
    if (!form.hourlyRate || Number.isNaN(rate) || rate <= 0)
      next.hourlyRate = "Hourly rate must be greater than 0";
    if (form.image.trim()) {
      try {
        // eslint-disable-next-line no-new
        new URL(form.image.trim());
      } catch {
        next.image = "Image must be a valid URL";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const trimmedImage = form.image.trim();
    createService.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId,
      location: form.location.trim(),
      hourlyRate: Number(form.hourlyRate),
      image: trimmedImage || undefined,
    });
  };

  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <Link
        href="/tech/services"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to services
      </Link>

      <section className="mb-8">
        <div className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-cyan-400/10 to-sky-400/5 px-6 py-8 md:px-10 md:py-10">
          <div className="hero-overlay absolute inset-0 -z-10" />
          <div className="relative flex flex-col items-center text-center gap-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New service
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl md:text-4xl font-bold tracking-tight"
            >
              Add a service you{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                offer
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="max-w-xl text-sm md:text-base text-muted-foreground"
            >
              Customers will see this listing and can book you for it.
            </motion.p>
          </div>
        </div>
      </section>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border bg-card p-6 md:p-8 space-y-5"
      >
        {/* Title */}
        <Field
          label="Service title"
          icon={Briefcase}
          error={errors.title}
          hint="3–100 characters. Be specific (e.g. &quot;AC repair at home&quot;)."
        >
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Home electrical wiring"
            maxLength={100}
          />
        </Field>

        {/* Description */}
        <Field
          label="Description"
          icon={Sparkles}
          optional
          hint="Optional. Explain what's included."
        >
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What's included, area served, any specialties…"
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </Field>
        {/* Image */}
        <Field
          label="Image URL"
          icon={Sparkles}
          optional
          error={errors.image}
          hint="Paste a public image link. Leave as default to use the placeholder."
        >
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image.trim() || DEFAULT_SERVICE_IMAGE}
                alt="Service preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_SERVICE_IMAGE;
                }}
              />
            </div>
            <Input
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder={DEFAULT_SERVICE_IMAGE}
            />
          </div>
        </Field>
        {/* Category */}
        <Field
          label="Category"
          icon={Tag}
          error={errors.categoryId}
          hint="Pick the closest match — customers filter by category."
        >
          {catsLoading ? (
            <div className="flex items-center gap-2 rounded-md border bg-background/50 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading categories…
            </div>
          ) : catsError ? (
            <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Couldn&apos;t load categories
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => refetchCats()}
              >
                Retry
              </Button>
            </div>
          ) : (
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Choose a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        {/* Location */}
        <Field
          label="Service area"
          icon={MapPin}
          error={errors.location}
          hint="City, neighborhood, or area you cover."
        >
          <Input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Dhanmondi, Dhaka"
          />
        </Field>

        {/* Hourly rate */}
        <Field
          label="Hourly rate (BDT)"
          icon={Wallet}
          error={errors.hourlyRate}
          hint="What you charge per hour."
        >
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={form.hourlyRate}
            onChange={(e) => set("hourlyRate", e.target.value)}
            placeholder="e.g. 500"
          />
        </Field>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/tech/services")}
            disabled={createService.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            disabled={createService.isPending || catsLoading}
          >
            {createService.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {createService.isPending ? "Creating…" : "Create service"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ----------------------- Components ----------------------- */

function Field({
  label,
  icon: Icon,
  children,
  error,
  hint,
  optional,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
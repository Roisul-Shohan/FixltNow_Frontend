"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Camera,
  Edit3,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { cn, safeFormatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  );
}

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface MeUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  role: string;
  status: string;
  createdAt?: string;
  // Some responses may carry these on the user object
  bio?: string | null;
  yearsOfExperience?: number | null;
}

interface ProfileForm {
  name: string;
  phone: string;
  profileImage: string;
  bio: string;
  yearsOfExperience: string;
}

export default function CustomerProfilePage() {
  const qc = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<ApiSuccess<MeUser>>({
    queryKey: ["customer-me"],
    queryFn: async () => (await api.get("/auth/me")).data,
    staleTime: 30_000,
  });

  const user = data?.data;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    profileImage: "",
    bio: "",
    yearsOfExperience: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      phone: user.phone ?? "",
      profileImage: user.profileImage ?? "",
      bio: user.bio ?? "",
      yearsOfExperience:
        user.yearsOfExperience != null ? String(user.yearsOfExperience) : "",
    });
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<ProfileForm>) => {
      const body: Record<string, unknown> = {};
      if (payload.name !== undefined) body.name = payload.name;
      if (payload.phone !== undefined) body.phone = payload.phone;
      if (payload.profileImage !== undefined)
        body.profileImage = payload.profileImage;
      if (payload.bio !== undefined) body.bio = payload.bio;
      if (payload.yearsOfExperience !== undefined) {
        const num = Number(payload.yearsOfExperience);
        body.yearsOfExperience = Number.isFinite(num)
          ? num
          : payload.yearsOfExperience;
      }
      const res = await api.patch("/auth/me", body);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["customer-me"] });
      qc.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Failed to update profile");
    },
  });

  function onSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    updateMutation.mutate({
      name: form.name,
      phone: form.phone,
      profileImage: form.profileImage,
      bio: form.bio,
      yearsOfExperience: form.yearsOfExperience,
    });
  }

  function onCancel() {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      phone: user.phone ?? "",
      profileImage: user.profileImage ?? "",
      bio: user.bio ?? "",
      yearsOfExperience:
        user.yearsOfExperience != null ? String(user.yearsOfExperience) : "",
    });
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <div className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-cyan-400/10 to-sky-400/5 px-6 py-10 md:px-10 md:py-14">
          <div className="hero-overlay absolute inset-0 -z-10" />
          <div className="relative flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl md:text-5xl font-bold tracking-tight"
            >
              Your{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                account
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="max-w-xl text-sm md:text-base text-muted-foreground"
            >
              Update the basics we use to introduce you to your technicians.
            </motion.p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-8 animate-pulse h-64" />
      ) : isError ? (
        <ErrorPanel
          message={
            (error as any)?.response?.data?.message ||
            (error as any)?.message ||
            "Failed to load profile"
          }
          onRetry={() => refetch()}
        />
      ) : !user ? (
        <Empty />
      ) : (
        <>
          {/* Profile card */}
          <section className="rounded-2xl border bg-card p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <Avatar
                  src={user.profileImage}
                  name={user.name}
                  size="lg"
                />
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight truncate">
                    {user.name}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="info" className="capitalize">
                      {user.role?.toLowerCase() || "customer"}
                    </Badge>
                    <Badge
                      variant={
                        user.status === "ACTIVE" ? "success" : "secondary"
                      }
                      className="capitalize"
                    >
                      {user.status?.toLowerCase()}
                    </Badge>
                    {user.createdAt ? (
                      <span className="text-xs text-muted-foreground">
                        Member since{" "}
                        {safeFormatDate(user.createdAt, "—", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editing ? (
                  <Button onClick={() => setEditing(true)}>
                    <Edit3 className="h-4 w-4" />
                    Edit profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={onCancel}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={onSave}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  aria-label="Refresh"
                >
                  <Camera
                    className={cn(
                      "h-4 w-4",
                      isRefetching && "animate-spin"
                    )}
                  />
                </Button>
              </div>
            </div>
          </section>

          {/* Form */}
          <section className="rounded-2xl border bg-card p-6 md:p-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Account details
            </h3>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Full name"
                icon={User}
                value={form.name}
                editable={editing}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <Field
                label="Email"
                icon={Mail}
                value={user.email}
                editable={false}
                hint="Email cannot be changed"
              />
              <Field
                label="Phone"
                icon={Phone}
                value={form.phone}
                editable={editing}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="+880 1XXX-XXXXXX"
              />
              <Field
                label="Years of experience"
                icon={ShieldCheck}
                value={form.yearsOfExperience}
                editable={editing}
                onChange={(v) =>
                  setForm((f) => ({ ...f, yearsOfExperience: v }))
                }
                placeholder="0"
                type="number"
              />
              <div className="md:col-span-2">
                <Field
                  label="Profile image URL"
                  icon={Camera}
                  value={form.profileImage}
                  editable={editing}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, profileImage: v }))
                  }
                  placeholder="https://..."
                />
                {form.profileImage && editing ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar
                      src={form.profileImage}
                      name={form.name}
                      size="sm"
                    />
                    <span>Preview</span>
                  </div>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Bio</Label>
                {editing ? (
                  <Textarea
                    rows={4}
                    value={form.bio}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bio: e.target.value }))
                    }
                    placeholder="Tell technicians a little about yourself."
                  />
                ) : (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                    {form.bio || (
                      <span className="italic text-muted-foreground">
                        No bio yet.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------- Components ---------- */

function Field({
  label,
  icon: Icon,
  value,
  editable,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  editable: boolean;
  onChange?: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      {editable ? (
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{value || "—"}</span>
        </div>
      )}
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-12 w-12 text-base";
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          dim,
          "rounded-full object-cover border bg-muted"
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        dim,
        "rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-semibold flex items-center justify-center"
      )}
    >
      {name?.charAt(0)?.toUpperCase() ?? "U"}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/30 p-10 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">No profile data</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn&apos;t load your profile right now.
      </p>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
      <AlertCircle className="h-6 w-6 text-destructive" />
      <p className="font-semibold text-destructive">
        Couldn&apos;t load profile
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Camera,
  Edit3,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Star,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ----------------------- Types ----------------------- */

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  role: string;
  status: string;
  createdAt: string;
}

interface ProfileService {
  id: string;
  title: string;
  hourlyRate: number;
  isActive: boolean;
  category?: { id: string; name: string };
}

interface ProfileStats {
  upcomingBookings: number;
  totalEarnings: number;
}

interface ProfilePayload {
  id: string;
  bio?: string | null;
  yearsOfExperience?: number | null;
  averageRating?: number;
  totalReviews?: number;
  createdAt?: string;
  user: ProfileUser;
  service?: ProfileService[];
  stats: ProfileStats;
}

interface ProfileForm {
  name: string;
  phone: string;
  profileImage: string;
  bio: string;
  yearsOfExperience: string;
}

/* ----------------------- Page ----------------------- */

export default function TechnicianProfilePage() {
  const qc = useQueryClient();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<ApiSuccess<ProfilePayload>>({
    queryKey: ["tech-profile"],
    queryFn: async () => (await api.get("/technicians/me/profile")).data,
    staleTime: 30_000,
  });

  const profile = data?.data;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    profileImage: "",
    bio: "",
    yearsOfExperience: "",
  });

  // Hydrate the form when profile loads or when entering edit mode
  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.user?.name ?? "",
      phone: profile.user?.phone ?? "",
      profileImage: profile.user?.profileImage ?? "",
      bio: profile.bio ?? "",
      yearsOfExperience:
        profile.yearsOfExperience != null
          ? String(profile.yearsOfExperience)
          : "",
    });
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (payload: {
      name?: string;
      phone?: string;
      profileImage?: string;
      bio?: string;
      yearsOfExperience?: number;
    }) => {
      const res = await api.put("/technicians/profile", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["tech-profile"] });
      qc.invalidateQueries({ queryKey: ["technician-dashboard"] });
      setEditing(false);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Update failed"
      );
    },
  });

  const handleSave = () => {
    const payload: {
      name?: string;
      phone?: string;
      profileImage?: string;
      bio?: string;
      yearsOfExperience?: number;
    } = {};

    if (editing) {
      const trimmedName = form.name.trim();
      const trimmedPhone = form.phone.trim();
      const trimmedImage = form.profileImage.trim();
      const trimmedBio = form.bio.trim();
      const yoeRaw = form.yearsOfExperience.trim();

      if (trimmedName) payload.name = trimmedName;
      if (trimmedPhone) payload.phone = trimmedPhone;
      if (trimmedImage) payload.profileImage = trimmedImage;
      if (trimmedBio) payload.bio = trimmedBio;
      if (yoeRaw) {
        const yoe = Number(yoeRaw);
        if (Number.isNaN(yoe) || yoe < 0) {
          toast.error("Years of experience must be a non-negative number");
          return;
        }
        payload.yearsOfExperience = yoe;
      }

      if (Object.keys(payload).length === 0) {
        toast.error("Nothing to update");
        return;
      }
    }

    updateProfile.mutate(payload);
  };

  const initials = useMemo(() => {
    const source = profile?.user?.name || form.name || "T";
    return source
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [profile?.user?.name, form.name]);

  const joinedYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : null;

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <section className="mb-10">
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
              My Profile
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl md:text-5xl font-bold tracking-tight"
            >
              Your{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                technician profile
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="max-w-xl text-sm md:text-base text-muted-foreground"
            >
              Keep your profile up to date so customers know who they’re
              inviting into their home.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshIcon />
                )}
                Refresh
              </Button>
              {!editing ? (
                <Button onClick={() => setEditing(true)}>
                  <Edit3 className="h-4 w-4" />
                  Edit profile
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      // re-hydrate from server
                      if (profile) {
                        setForm({
                          name: profile.user?.name ?? "",
                          phone: profile.user?.phone ?? "",
                          profileImage: profile.user?.profileImage ?? "",
                          bio: profile.bio ?? "",
                          yearsOfExperience:
                            profile.yearsOfExperience != null
                              ? String(profile.yearsOfExperience)
                              : "",
                        });
                      }
                    }}
                    disabled={updateProfile.isPending}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save changes
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <ProfileSkeleton />
      ) : isError ? (
        <ErrorPanel
          message={
            (error as any)?.response?.data?.message ||
            (error as any)?.message ||
            "Failed to load profile"
          }
          onRetry={() => refetch()}
        />
      ) : !profile ? (
        <ErrorPanel message="No profile data" onRetry={() => refetch()} />
      ) : (
        <>
          {/* Overview card */}
          <section className="mb-8 rounded-2xl border bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                src={profile.user?.profileImage || form.profileImage}
                fallback={initials}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight">
                    {profile.user?.name}
                  </h2>
                  <Badge variant="success" className="gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.user?.email}
                </p>
                {profile.user?.phone ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {profile.user.phone}
                  </p>
                ) : null}
                {joinedYear ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Technician since {joinedYear}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-3 sm:max-w-md">
                <MiniStat
                  label="Rating"
                  value={
                    profile.averageRating != null
                      ? profile.averageRating.toFixed(1)
                      : "—"
                  }
                  icon={Star}
                />
                <MiniStat
                  label="Reviews"
                  value={String(profile.totalReviews ?? 0)}
                />
                <MiniStat
                  label="Earnings"
                  value={formatBDT(profile.stats?.totalEarnings ?? 0)}
                />
              </div>
            </div>
          </section>

          {/* Editable fields */}
          <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Full name"
              icon={User}
              value={form.name}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Your name"
            />
            <Field
              label="Email"
              icon={Mail}
              value={profile.user?.email ?? ""}
              editing={false}
              onChange={() => {}}
              placeholder=""
              readOnlyHint
            />
            <Field
              label="Phone"
              icon={Phone}
              value={form.phone}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="+880 1XXX-XXXXXX"
            />
            <Field
              label="Years of experience"
              icon={ShieldCheck}
              value={form.yearsOfExperience}
              editing={editing}
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
                editing={editing}
                onChange={(v) =>
                  setForm((f) => ({ ...f, profileImage: v }))
                }
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bio" className="mb-2 inline-flex items-center gap-1.5">
                About you
              </Label>
              {editing ? (
                <textarea
                  id="bio"
                  rows={4}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  placeholder="Tell customers about your skills, experience, and what makes you a great technician."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              ) : (
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm min-h-[6rem]">
                  {profile.bio ? (
                    <p className="whitespace-pre-wrap">{profile.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No bio yet — add a short intro to help customers.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Services offered */}
          <section>
            <h2 className="mb-4 font-semibold tracking-tight">
              Services you offer
            </h2>
            {profile.service && profile.service.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {profile.service.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border bg-card p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold truncate">{s.title}</h3>
                      <Badge variant={s.isActive ? "success" : "secondary"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {s.category?.name ? (
                      <p className="text-xs text-muted-foreground">
                        {s.category.name}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-primary font-semibold">
                      {formatBDT(s.hourlyRate)}/hr
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed bg-card/30 p-8 text-center text-sm text-muted-foreground">
                You haven’t added any services yet.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ----------------------- Components ----------------------- */

function Avatar({
  src,
  fallback,
}: {
  src?: string | null;
  fallback: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt="Profile"
        className="h-20 w-20 rounded-full object-cover border-2 border-primary/20"
      />
    );
  }
  return (
    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white flex items-center justify-center text-2xl font-bold">
      {fallback}
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  editing,
  onChange,
  placeholder,
  type = "text",
  readOnlyHint = false,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnlyHint?: boolean;
}) {
  return (
    <div>
      <Label className="mb-2 inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
        {readOnlyHint ? (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            (read-only)
          </span>
        ) : null}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={
          editing
            ? (e) => onChange(e.target.value)
            : undefined
        }
        readOnly={!editing || readOnlyHint}
        placeholder={placeholder}
        className={cn(!editing && "bg-muted/30 cursor-default")}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 justify-center">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </div>
      <div className="mt-1 text-sm font-bold tracking-tight">{value}</div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 animate-pulse h-28" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border bg-muted/30 h-10 animate-pulse"
          />
        ))}
      </div>
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
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
      <p className="font-semibold text-destructive">
        Couldn&apos;t load profile
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-3">
        Try again
      </Button>
    </div>
  );
}

function RefreshIcon() {
  // Inline refresh icon (to avoid pulling in another import if not used elsewhere)
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
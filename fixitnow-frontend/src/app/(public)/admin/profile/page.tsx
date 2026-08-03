"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess, Role, User as UserType } from "@/types";

interface ProfileForm {
  name: string;
  phone: string;
  profileImage: string;
}

const EMPTY_FORM: ProfileForm = { name: "", phone: "", profileImage: "" };

export default function AdminProfilePage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ApiSuccess<UserType>
  >({
    queryKey: ["admin-profile"],
    queryFn: async () => (await api.get("/auth/me")).data,
    staleTime: 30_000,
  });

  const user = data?.data;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      phone: user.phone ?? "",
      profileImage: user.image ?? "",
    });
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async (payload: {
      name?: string;
      phone?: string;
      profileImage?: string;
    }) => {
      const res = await api.patch("/auth/me", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["admin-profile"] });
      qc.invalidateQueries({ queryKey: ["auth-me"] });
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
    } = {};

    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedImage = form.profileImage.trim();

    if (trimmedName) payload.name = trimmedName;
    if (trimmedPhone) payload.phone = trimmedPhone;
    if (trimmedImage) payload.profileImage = trimmedImage;

    if (Object.keys(payload).length === 0) {
      toast.error("Nothing to update");
      return;
    }
    updateProfile.mutate(payload);
  };

  const initials = useMemo(() => {
    const source = user?.name || form.name || "A";
    return source
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.name, form.name]);

  const joinedYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : null;

  return (
    <div className="space-y-6">
      <Header />

      {isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-destructive">
              Couldn&apos;t load your profile.
            </p>
            <p className="text-muted-foreground mt-1">
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "Please check your connection and try again."}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isLoading || !user ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Hero */}
          <section className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-cyan-400/10 to-sky-400/5 px-6 py-8 md:px-10 md:py-10">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-bold flex items-center justify-center text-2xl sm:text-3xl ring-4 ring-background/60 overflow-hidden">
                  {(form.profileImage || user.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.profileImage || (user.image as string)}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background border shadow">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </span>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {user.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground break-all">
                  {user.email}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge variant="outline" className="font-medium">
                  <ShieldCheck className="h-3 w-3 mr-1 text-primary" />
                  {roleLabel(user.role)}
                </Badge>
                {user.status ? (
                  <Badge
                    variant={user.status === "ACTIVE" ? "success" : "destructive"}
                    className="font-medium"
                  >
                    {user.status === "ACTIVE" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    {user.status}
                  </Badge>
                ) : null}
                {joinedYear ? (
                  <Badge variant="secondary" className="font-medium">
                    Joined {joinedYear}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
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
                        setForm({
                          name: user.name ?? "",
                          phone: user.phone ?? "",
                          profileImage: user.image ?? "",
                        });
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
              </div>
            </div>
          </section>

          {/* Form */}
          <section className="rounded-2xl border bg-card p-5 sm:p-6 space-y-6">
            <header>
              <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <User className="h-3.5 w-3.5" />
                Account details
              </div>
              <h2 className="mt-2 text-lg sm:text-xl font-bold tracking-tight">
                Personal information
              </h2>
              <p className="text-sm text-muted-foreground">
                Admin accounts only control name, phone, and avatar.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Full name"
                value={editing ? form.name : user.name ?? ""}
                disabled={!editing}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Your name"
                icon={User}
              />

              <Field
                label="Email"
                value={user.email ?? ""}
                disabled
                onChange={() => undefined}
                placeholder="you@fixitnow.io"
                icon={Mail}
              />

              <Field
                label="Phone"
                value={editing ? form.phone : user.phone ?? ""}
                disabled={!editing}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="+880 1XXX-XXXXXX"
                icon={Phone}
              />

              <Field
                label="Profile image URL"
                value={editing ? form.profileImage : user.image ?? ""}
                disabled={!editing}
                onChange={(v) => setForm((f) => ({ ...f, profileImage: v }))}
                placeholder="https://…"
                icon={Camera}
              />
            </div>

            <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
              <p>
                Role, status, and join date are managed by the system — they
                can&apos;t be edited from this page.
              </p>
            </div>
          </section>

          {/* Quick links */}
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <header className="mb-4">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Admin shortcuts
              </h2>
              <p className="text-sm text-muted-foreground">
                Jump back to the parts of the dashboard you manage.
              </p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <ShortcutLink href="/admin" label="Overview" />
              <ShortcutLink href="/admin/users" label="Users" />
              <ShortcutLink href="/admin/bookings" label="Bookings" />
              <ShortcutLink href="/admin/services" label="Services" />
              <ShortcutLink href="/admin/categories" label="Categories" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------- Pieces ---------- */

function Header() {
  return (
    <header>
      <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
        <ShieldCheck className="h-3.5 w-3.5" />
        Admin Profile
      </div>
      <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
        Your admin account
      </h1>
      <p className="text-sm md:text-base text-muted-foreground mt-1">
        Update your display name, phone number, and avatar.
      </p>
    </header>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    </div>
  );
}

function ShortcutLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border bg-background/60 px-4 py-3 text-sm font-medium transition-all hover:bg-primary/5 hover:border-primary/40"
    >
      <span>{label}</span>
      <span className="text-muted-foreground group-hover:text-primary">→</span>
    </Link>
  );
}

function roleLabel(role?: Role) {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "TECHNICIAN":
      return "Technician";
    case "CUSTOMER":
      return "Customer";
    default:
      return "User";
  }
}
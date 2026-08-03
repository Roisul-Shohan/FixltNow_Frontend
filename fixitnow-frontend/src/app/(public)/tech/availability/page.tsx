"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/* ----------------------- Types ----------------------- */

interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface Slot {
  startTime: string;
  endTime: string;
}

interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  slots: Slot[];
}

interface AvailabilityPayload {
  technicianId: string;
  schedule: ScheduleEntry[];
}

type DraftSlot = Slot & { _key: string };

interface DayCardProps {
  isoDate: string;
  label: string;
  weekday: string;
  isToday: boolean;
  isPast: boolean;
  slots: Slot[];
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

/* ----------------------- Helpers ----------------------- */

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function fmtIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toMinutes(hhmm: string): number {
  if (!TIME_REGEX.test(hhmm)) return -1;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function next7Days(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function sortSlots(slots: Slot[]): Slot[] {
  return [...slots].sort((a, b) => {
    const am = toMinutes(a.startTime);
    const bm = toMinutes(b.startTime);
    return am - bm;
  });
}

function randomKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function slotsEqual(a: Slot[], b: Slot[]): boolean {
  if (a.length !== b.length) return false;
  const sa = sortSlots(a);
  const sb = sortSlots(b);
  return sa.every((s, i) => s.startTime === sb[i].startTime && s.endTime === sb[i].endTime);
}

/* ----------------------- Page ----------------------- */

export default function TechnicianAvailabilityPage() {
  const days = useMemo(() => next7Days(), []);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<ApiSuccess<AvailabilityPayload>>({
    queryKey: ["tech-availability"],
    queryFn: async () => (await api.get("/technicians/me/availability")).data,
    staleTime: 30_000,
  });

  const scheduleMap = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    (data?.data?.schedule ?? []).forEach((entry) => {
      map[entry.date] = sortSlots(entry.slots);
    });
    return map;
  }, [data]);

  // Auto-cancel edit mode when server data changes (e.g. after save)
  useEffect(() => {
    if (editingDate && !scheduleMap[editingDate]) {
      setEditingDate(null);
    }
  }, [editingDate, scheduleMap]);

  const totalSlots = useMemo(
    () =>
      Object.values(scheduleMap).reduce((acc, s) => acc + s.length, 0),
    [scheduleMap]
  );

  const daysWithSlots = useMemo(
    () =>
      Object.values(scheduleMap).filter((s) => s.length > 0).length,
    [scheduleMap]
  );

  return (
    <>
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
                <CalendarDays className="h-3.5 w-3.5" />
                Availability
              </motion.div>
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="text-3xl md:text-5xl font-bold tracking-tight"
              >
                Set when you{" "}
                <span className="bg-gradient-to-r from-primary via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                  can work
                </span>
              </motion.h1>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="max-w-xl text-sm md:text-base text-muted-foreground"
              >
                Manage your schedule for the next 7 days. Customers can only
                book you during open slots.
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
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      isRefetching && "animate-spin"
                    )}
                  />
                  Refresh
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/tech/bookings">
                    <Clock className="h-4 w-4" />
                    View bookings
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryTile
            label="Days scheduled"
            value={`${daysWithSlots}/7`}
            icon={CalendarDays}
          />
          <SummaryTile
            label="Total open slots"
            value={String(totalSlots)}
            icon={Clock}
          />
          <SummaryTile
            label="Editable window"
            value="Today + 6"
            icon={CheckCircle2}
          />
        </section>

        {/* Day grid */}
        <section>
          {isLoading ? (
            <SkeletonGrid />
          ) : isError ? (
            <ErrorPanel
              message={
                (error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "Failed to load availability"
              }
              onRetry={() => refetch()}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {days.map((d, idx) => {
                const iso = fmtIsoDate(d);
                const slots = scheduleMap[iso] ?? [];
                const isToday = idx === 0;
                const isPast = false; // always within today+6
                return (
                  <DayCard
                    key={iso}
                    isoDate={iso}
                    label={d.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                    weekday={d.toLocaleDateString(undefined, {
                      weekday: "long",
                    })}
                    isToday={isToday}
                    isPast={isPast}
                    slots={slots}
                    editing={editingDate === iso}
                    onEdit={() => setEditingDate(iso)}
                    onCancel={() => setEditingDate(null)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

/* ----------------------- Components ----------------------- */

function SummaryTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function DayCard(props: DayCardProps) {
  const {
    isoDate,
    label,
    weekday,
    isToday,
    slots,
    editing,
    onEdit,
    onCancel,
  } = props;

  const qc = useQueryClient();

  const [draft, setDraft] = useState<DraftSlot[]>(() =>
    slots.map((s) => ({ ...s, _key: randomKey() }))
  );

  // Re-seed draft whenever server slots change while not editing
  useEffect(() => {
    if (!editing) {
      setDraft(slots.map((s) => ({ ...s, _key: randomKey() })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(slots), editing]);

  const save = useMutation({
    mutationFn: async (next: Slot[]) => {
      const res = await api.put("/technicians/availability", {
        date: isoDate,
        slots: next,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Availability updated for ${label}`);
      qc.invalidateQueries({ queryKey: ["tech-availability"] });
      onCancel();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update availability"
      );
    },
  });

  const addSlot = () => {
    setDraft((prev) => [
      ...prev,
      { startTime: "09:00", endTime: "10:00", _key: randomKey() },
    ]);
  };

  const removeSlot = (key: string) => {
    setDraft((prev) => prev.filter((s) => s._key !== key));
  };

  const updateSlot = (
    key: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setDraft((prev) =>
      prev.map((s) => (s._key === key ? { ...s, [field]: value } : s))
    );
  };

  const hasChanges = !slotsEqual(slots, draft.map(({ _key, ...rest }) => rest));

  const onSubmit = () => {
    // Validate
    for (const s of draft) {
      if (!TIME_REGEX.test(s.startTime) || !TIME_REGEX.test(s.endTime)) {
        toast.error("Times must be in HH:MM 24h format");
        return;
      }
      if (toMinutes(s.endTime) <= toMinutes(s.startTime)) {
        toast.error("End time must be after start time");
        return;
      }
    }
    const cleaned = draft.map(({ _key, ...rest }) => rest);
    save.mutate(sortSlots(cleaned));
  };

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border bg-card p-5 transition-all",
        editing && "ring-2 ring-primary/40 shadow-md",
        isToday && !editing && "border-primary/40"
      )}
    >
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold tracking-tight">{label}</h3>
            {isToday ? (
              <Badge variant="info" className="text-[10px]">
                Today
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{weekday}</p>
        </div>
        {editing ? (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onCancel}
              disabled={save.isPending}
              aria-label="Cancel edit"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
        )}
      </header>

      {editing ? (
        <div className="space-y-2">
          {draft.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No slots — add one below.
            </p>
          ) : (
            draft.map((slot) => (
              <div
                key={slot._key}
                className="flex items-center gap-2 rounded-lg border bg-background/50 p-2"
              >
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) =>
                    updateSlot(slot._key, "startTime", e.target.value)
                  }
                  className="h-9 w-[110px] text-sm"
                  aria-label="Start time"
                />
                <span className="text-xs text-muted-foreground">→</span>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) =>
                    updateSlot(slot._key, "endTime", e.target.value)
                  }
                  className="h-9 w-[110px] text-sm"
                  aria-label="End time"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeSlot(slot._key)}
                  disabled={save.isPending}
                  aria-label="Remove slot"
                  className="ml-auto text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={addSlot}
            disabled={save.isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Add slot
          </Button>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={save.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="gradient"
              onClick={onSubmit}
              disabled={save.isPending || !hasChanges}
              className="flex-1"
            >
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-xs text-muted-foreground">No slots set</p>
          <Button size="sm" variant="link" onClick={onEdit} className="mt-1">
            Add availability
          </Button>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {slots.map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2 text-sm"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {s.startTime} – {s.endTime}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {toMinutes(s.endTime) - toMinutes(s.startTime)} min
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border bg-card p-5 animate-pulse h-44"
        />
      ))}
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
      <p className="font-semibold text-destructive">Couldn&apos;t load availability</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry} className="mt-3">
        Try again
      </Button>
    </div>
  );
}
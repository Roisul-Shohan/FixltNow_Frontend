"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess, Service } from "@/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

type BookingSuccess = {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: string;
  customerAddress: string;
  service: { id: string; title: string };
  technician: {
    id: string;
    name: string;
    profileImage?: string | null;
  };
};

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const isValidHHmm = (s: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr${h > 1 ? "s" : ""}`;
  return `${h} hr${h > 1 ? "s" : ""} ${m} min`;
};

const nextSevenDays = () => {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
};

export default function BookServicePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, token, initialized, loadMe } = useAuthStore();
  // `router` is kept imported in case we ever need to deep-link elsewhere;
  // currently the inline auth gate handles sign-in without navigation.
  void router;

  // Auth rule for booking:
  //   • Logged-in CUSTOMER  → stay on this page, see the booking form.
  //   • Logged-in non-CUSTOMER → send to their dashboard (they can't book).
  //   • Guest (no token) → send to /login with a `next` so we bounce back
  //     here after sign-in.
  // The effect only fires once `initialized` resolves, so already-logged-in
  // users never see a flash of the login screen.
  const [authChecked, setAuthChecked] = useState(initialized);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  // Free-form start/end the customer types in (HH:mm). Constrained to the
  // selected slot's bounds by both UI (min/max attributes) and validation below.
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [successBooking, setSuccessBooking] = useState<BookingSuccess | null>(
    null,
  );

  // Make sure we've asked /auth/me at least once so we know whether to
  // redirect. This only runs once per visit.
  useEffect(() => {
    if (!initialized) {
      loadMe().finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, [initialized, loadMe]);

  const isCustomer = Boolean(token) && user?.role === "CUSTOMER";
  const isLoggedInNonCustomer =
    Boolean(token) && !!user && user.role !== "CUSTOMER";

  // Redirect guests to /login and non-customers to their dashboard. This is
  // idempotent: logged-in customers fall through and the booking form renders.
  useEffect(() => {
    if (!authChecked) return;
    if (isCustomer) return;
    if (isLoggedInNonCustomer) {
      router.replace("/dashboard");
      return;
    }
    router.replace(
      `/login?next=${encodeURIComponent(window.location.pathname)}`,
    );
  }, [authChecked, isCustomer, isLoggedInNonCustomer, router]);

  // Fetch service details. We only fetch once the user is a confirmed
  // CUSTOMER so guests never see slots before being redirected.
  const {
    data: res,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ApiSuccess<Service>>({
    queryKey: ["service", id],
    queryFn: async () => {
      const r = await api.get(`/services/${id}`);
      return r.data;
    },
    enabled: authChecked && isCustomer,
  });

  const service = res?.data;
  const tech = service?.technician as
    | (NonNullable<Service["technician"]> & {
        user?: { name?: string; email?: string; profileImage?: string };
        bio?: string;
      })
    | undefined;
  const techName = (tech as any)?.user?.name ?? (tech as any)?.name ?? "Technician";
  const techInitial = techName.charAt(0).toUpperCase();
  // Backend returns availability on `service.technician.avalability` (typo
  // preserved on purpose so the existing Prisma relation keeps working). Both
  // are arrays of { id, date: Date|string, startTime, endTime, ... }.
  const rawAvailabilities =
    (tech as any)?.avalability ??
    (service as any)?.availabilities ??
    [];

  // Group slots by date key. `slot.date` may arrive as an ISO string ("2025-11-22")
  // or as a Date object depending on the JSON serializer path — handle both.
  const normalizeSlotDate = (value: unknown): string => {
    if (!value) return "unknown";
    if (typeof value === "string") {
      // ISO "YYYY-MM-DD..." → take the date part.
      return value.length >= 10 ? value.slice(0, 10) : value;
    }
    if (value instanceof Date) return toDateKey(value);
    return String(value);
  };

  const slotsByDate = useMemo(() => {
    const map = new Map<string, typeof rawAvailabilities>();
    for (const slot of rawAvailabilities) {
      const key = normalizeSlotDate(slot?.date);
      const arr = map.get(key) ?? [];
      arr.push(slot);
      map.set(key, arr);
    }
    return map;
  }, [rawAvailabilities]);

  const days = useMemo(() => nextSevenDays(), []);
  const availableDays = useMemo(() => {
    // Only show next-7-days that have at least one slot.
    return days
      .map((d) => ({ date: d, key: toDateKey(d) }))
      .filter(({ key }) => (slotsByDate.get(key)?.length ?? 0) > 0);
  }, [days, slotsByDate]);

  // Auto-select first available day once data loads.
  useEffect(() => {
    if (!selectedDate && availableDays.length > 0) {
      setSelectedDate(availableDays[0].key);
    }
  }, [availableDays, selectedDate]);

  const slotsForSelected = (selectedDate && slotsByDate.get(selectedDate)) || [];
  const selectedSlot = slotsForSelected.find((s: any) => s.id === selectedSlotId);

  // When the customer picks a new slot, default the time inputs to the slot's
  // full window. They can then trim either end freely.
  useEffect(() => {
    if (!selectedSlot) {
      setStartTime("");
      setEndTime("");
      return;
    }
    setStartTime(selectedSlot.startTime);
    setEndTime(selectedSlot.endTime);
  }, [selectedSlotId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate the customer's free-form times against the selected slot.
  const timeValidation = useMemo(() => {
    if (!selectedSlot) return { ok: false, reason: "" as string };
    if (!startTime || !endTime) {
      return { ok: false, reason: "Please choose both a start and an end time." };
    }
    if (!isValidHHmm(startTime) || !isValidHHmm(endTime)) {
      return { ok: false, reason: "Please enter a valid time (HH:mm)." };
    }
    const slotStart = toMinutes(selectedSlot.startTime);
    const slotEnd = toMinutes(selectedSlot.endTime);
    const cs = toMinutes(startTime);
    const ce = toMinutes(endTime);
    if (cs < slotStart || ce > slotEnd) {
      return {
        ok: false,
        reason: `Time must be inside the slot (${selectedSlot.startTime}–${selectedSlot.endTime}).`,
      };
    }
    if (ce <= cs) {
      return { ok: false, reason: "End time must be after start time." };
    }
    return { ok: true, reason: "" };
  }, [selectedSlot, startTime, endTime]);

  const durationMinutes = timeValidation.ok
    ? toMinutes(endTime) - toMinutes(startTime)
    : 0;
  // Backend rounds up to whole hours; show the same billable figure in the UI.
  const billableHours = Math.max(1, Math.ceil(durationMinutes / 60));
  const estimatedTotal = service ? Number(service.hourlyRate) * billableHours : 0;

  const createBooking = useMutation({
    mutationFn: async () => {
      const res = await api.post("/bookings", {
        serviceId: service!.id,
        bookingDate: selectedDate,
        startTime,
        endTime,
        customerAddress: address.trim(),
      });
      return res.data?.data as BookingSuccess;
    },
    onSuccess: (booking) => {
      setSuccessBooking(booking);
    },
  });

  const submitting = createBooking.isPending;
  const submitError =
    (createBooking.error as any)?.response?.data?.message ||
    (createBooking.error as Error)?.message ||
    "";

  const canSubmit =
    Boolean(token) &&
    user?.role === "CUSTOMER" &&
    Boolean(service) &&
    Boolean(selectedDate) &&
    Boolean(selectedSlot) &&
    timeValidation.ok &&
    durationMinutes > 0 &&
    address.trim().length >= 5 &&
    !submitting &&
    !successBooking;

  // Success screen
  if (successBooking) {
    return (
      <main className="container py-16 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-xl mx-auto rounded-2xl border bg-card p-8 text-center space-y-4"
          >
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">Booking confirmed</h1>
            <div className="text-sm text-muted-foreground">
              Your booking is now <Badge variant="warning">PENDING</Badge> and
              waiting for {techName}&apos;s confirmation. We&apos;ll notify you
              once accepted.
            </div>

            <div className="rounded-xl border bg-muted/40 p-4 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{successBooking.service.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {new Date(successBooking.bookingDate).toLocaleDateString(
                    "en-US",
                    { weekday: "short", month: "short", day: "numeric" },
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-mono">
                  {successBooking.startTime} – {successBooking.endTime}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Estimated total</span>
                <span className="font-semibold">
                  {formatBDT(successBooking.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button asChild variant="outline">
                <Link href="/services">Browse more services</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Go to my dashboard</Link>
              </Button>
            </div>
          </motion.div>
      </main>
  );
}

  return (
    <>
      <section className="container py-6">
        <Link
          href={`/services/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to service
        </Link>
      </section>

      <main className="container pb-16 grid gap-8 lg:grid-cols-[1fr_380px] flex-1">
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Book this service
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pick a time slot, tell us where you need the work done, and
              we&apos;ll send the request to the technician.
            </p>
          </header>

          {!authChecked || !isCustomer ? (
            // Auth check still in flight, or the redirect above is about to
            // fire — show a skeleton so the user never sees a flash of an
            // empty form before the router.replace kicks in.
            <FormSkeleton />
          ) : isLoading ? (
            <FormSkeleton />
          ) : isError || !service ? (
            <ErrorState
              message={(error as Error)?.message}
              onRetry={() => refetch()}
            />
          ) : (
            <>
              {/* Date picker */}
              <Section
                icon={<Calendar className="h-4 w-4 text-primary" />}
                title="Pick a date"
                hint="Next 7 days only"
              >
                {availableDays.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    The technician has no available slots in the next 7 days.
                    Try again later or contact them directly.
                  </p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {availableDays.map(({ date, key }) => {
                      const active = key === selectedDate;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedDate(key);
                            setSelectedSlotId(null);
                          }}
                          className={cn(
                            "shrink-0 w-20 rounded-xl border px-2 py-3 text-center transition-all",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-md"
                              : "bg-card hover:border-primary/50 hover:bg-primary/5",
                          )}
                        >
                          <div className="text-[10px] uppercase tracking-wide opacity-80">
                            {date.toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                          </div>
                          <div className="text-xl font-bold leading-none mt-1">
                            {date.getDate()}
                          </div>
                          <div className="text-[10px] uppercase mt-1 opacity-80">
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Section>

              {/* Time slot picker */}
              {selectedDate && slotsForSelected.length > 0 && (
                <Section
                  icon={<Clock className="h-4 w-4 text-primary" />}
                  title="Pick a time slot"
                  hint="Each slot is the technician's pre-set availability"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slotsForSelected.map((slot: any) => {
                      const active = slot.id === selectedSlotId;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            setSelectedSlotId(slot.id);
                          }}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm font-mono transition-all",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow"
                              : "bg-card hover:border-primary/50 hover:bg-primary/5",
                          )}
                        >
                          <Clock className="inline h-3.5 w-3.5 mr-1.5" />
                          {slot.startTime} – {slot.endTime}
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Customer-entered start/end time, constrained to the chosen slot */}
              {selectedSlot && (
                <Section
                  icon={<Clock className="h-4 w-4 text-primary" />}
                  title="What time works for you?"
                  hint={`Type any time between ${selectedSlot.startTime} and ${selectedSlot.endTime} (15-minute steps).`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">
                        Start time
                      </span>
                      <input
                        type="time"
                        value={startTime}
                        min={selectedSlot.startTime}
                        max={selectedSlot.endTime}
                        step={900}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1 w-full rounded-lg border bg-card px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">
                        End time
                      </span>
                      <input
                        type="time"
                        value={endTime}
                        min={selectedSlot.startTime}
                        max={selectedSlot.endTime}
                        step={900}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1 w-full rounded-lg border bg-card px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </label>
                  </div>

                  {timeValidation.ok ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      Duration: <span className="font-medium text-foreground">
                        {formatDuration(durationMinutes)}
                      </span>{" "}
                      · billed as {billableHours} hr
                      {billableHours > 1 ? "s" : ""} ({" "}
                      {formatBDT(
                        service ? Number(service.hourlyRate) * billableHours : 0,
                      )}{" "}
                      )
                    </p>
                  ) : timeValidation.reason ? (
                    <p className="text-xs text-destructive mt-2 inline-flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {timeValidation.reason}
                    </p>
                  ) : null}
                </Section>
              )}

              {/* Address */}
              <Section
                icon={<MapPin className="h-4 w-4 text-primary" />}
                title="Where do you need the work?"
                hint="The technician will arrive at this address"
              >
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="House/flat, road, area, city"
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {address.length > 0 && address.trim().length < 5 && (
                  <p className="text-xs text-destructive mt-1.5">
                    Address must be at least 5 characters.
                  </p>
                )}
              </Section>

              {/* Notes */}
              <Section
                icon={<Wrench className="h-4 w-4 text-primary" />}
                title="Anything else?"
                hint="Optional — describe the problem to help the technician prepare"
              >
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. kitchen sink leaking under the cabinet, need it fixed today if possible."
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </Section>

              {submitError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-destructive">{submitError}</p>
                </div>
              )}

              <div className="md:hidden">
                <MobileSummary
                  service={service}
                  techName={techName}
                  startTime={startTime}
                  endTime={endTime}
                  durationLabel={timeValidation.ok ? formatDuration(durationMinutes) : "—"}
                  total={estimatedTotal}
                  address={address}
                  loading={submitting}
                  disabled={!canSubmit}
                  onSubmit={() => createBooking.mutate()}
                />
              </div>
            </>
          )}
        </div>

        {/* Right column: summary */}
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
          {isLoading || !service ? (
            <Skeleton className="h-72 w-full rounded-2xl" />
          ) : (
            <BookingSummary
              service={service}
              techName={techName}
              techInitial={techInitial}
              techBio={(tech as any)?.bio}
              techYears={(tech as any)?.yearsOfExperience}
              techRating={(tech as any)?.averageRating}
              dateKey={selectedDate}
              startTime={startTime}
              endTime={endTime}
              durationLabel={timeValidation.ok ? formatDuration(durationMinutes) : "—"}
              total={estimatedTotal}
              address={address}
              loading={submitting}
              disabled={!canSubmit}
              onSubmit={() => createBooking.mutate()}
            />
          )}
        </aside>
      </main>
    </>
  );
}

/* ---------- Sub-components ---------- */

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border bg-card p-5 space-y-3"
    >
      <div>
        <h2 className="text-sm font-semibold inline-flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {hint ? (
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        ) : null}
      </div>
      {children}
    </motion.section>
  );
}

function BookingSummary({
  service,
  techName,
  techInitial,
  techBio,
  techYears,
  techRating,
  dateKey,
  startTime,
  endTime,
  durationLabel,
  total,
  address,
  loading,
  disabled,
  onSubmit,
}: {
  service: Service;
  techName: string;
  techInitial: string;
  techBio?: string;
  techYears?: number;
  techRating?: number;
  dateKey: string | null;
  startTime: string;
  endTime: string;
  durationLabel: string;
  total: number;
  address: string;
  loading: boolean;
  disabled: boolean;
  onSubmit: () => void;
}) {
  const hasRating = (techRating ?? 0) > 0;
  const dateLabel = dateKey
    ? new Date(dateKey).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="rounded-2xl border bg-card p-6 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-lg font-bold flex items-center justify-center">
          {techInitial}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{techName}</p>
          {techBio ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {techBio}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-1">
            {techYears ? <span>{techYears}+ yrs experience</span> : null}
            {hasRating ? (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {Number(techRating).toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2 text-sm">
        <SummaryRow label="Service" value={service.title} />
        <SummaryRow label="Date" value={dateLabel} />
        <SummaryRow
          label="Time"
          value={startTime && endTime ? `${startTime} – ${endTime}` : "—"}
          mono
        />
        <SummaryRow
          label="Duration"
          value={durationLabel}
        />
        <SummaryRow
          label="Rate"
          value={`${formatBDT(service.hourlyRate)} / hr`}
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">Estimated total</span>
          <span className="text-lg font-bold text-primary">
            {formatBDT(total)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          You&apos;ll pay after the technician confirms the booking.
        </p>
      </div>

      {address.length > 0 && address.trim().length < 5 ? (
        <p className="text-xs text-destructive">
          Address must be at least 5 characters.
        </p>
      ) : null}

      <Button
        onClick={onSubmit}
        disabled={disabled}
        size="lg"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending booking…
          </>
        ) : (
          <>Confirm booking</>
        )}
      </Button>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
        <span>
          The technician has 24 hours to accept. The slot is held for you and
          released automatically if they decline.
        </span>
      </div>
    </motion.div>
  );
}

function MobileSummary(props: {
  service: Service;
  techName: string;
  startTime: string;
  endTime: string;
  durationLabel: string;
  total: number;
  address: string;
  loading: boolean;
  disabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border bg-card p-5 space-y-3"
    >
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-muted-foreground">Estimated total</span>
        <span className="text-lg font-bold text-primary">
          {formatBDT(props.total)}
        </span>
      </div>
      <Button
        onClick={props.onSubmit}
        disabled={props.disabled}
        size="lg"
        className="w-full"
      >
        {props.loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending booking…
          </>
        ) : (
          <>Confirm booking</>
        )}
      </Button>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-right", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="max-w-md mx-auto rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
      <h2 className="mt-3 text-lg font-semibold text-destructive">
        Couldn&apos;t load this service
      </h2>
      <p className="text-sm text-muted-foreground mt-2">
        {message || "The service may be unavailable or the link is invalid."}
      </p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/services">
            <ArrowLeft className="h-4 w-4" />
            Back to services
          </Link>
        </Button>
        <Button onClick={onRetry}>
          <Loader2 className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}

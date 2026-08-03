import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBDT(amount: number | string) {
  // The Prisma schema declares hourlyRate as Decimal, which Postgres returns
  // to the API as a string. Accept either type and coerce defensively.
  // en-BD locale Intl support is inconsistent on Windows/Node, so build the
  // string manually with the Bangladeshi taka symbol and grouped thousands.
  const numeric =
    typeof amount === "number"
      ? amount
      : typeof amount === "string" && amount.trim() !== ""
      ? Number(amount)
      : NaN;
  const value = Number.isFinite(numeric) ? Math.round(numeric) : 0;
  const grouped = value.toLocaleString("en-US");
  return `৳${grouped}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Returns a Date or null if the input is missing/invalid. Use this any time we
 * receive a date string from the API so we never end up rendering
 * "Invalid Date" in the UI.
 *
 * Rejects bare time strings (e.g. "03:00:00.000" coming from a Prisma `Time`
 * column) which JavaScript would otherwise silently parse as `1970-01-01T...Z`.
 * Real ISO timestamps and `YYYY-MM-DD` calendar dates are always accepted.
 */
export function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  const str = String(value).trim();
  if (!str || str === "null" || str === "undefined") return null;

  // Bare time-of-day string ("HH:MM[:SS[.fff]]") without a date component.
  // Prisma `Time` fields serialize this way. Parsing it would yield 1970-01-01.
  if (/^\d{1,2}:\d{2}(:\d{2}(\.\d{1,7})?)?$/.test(str)) return null;

  const d = new Date(str);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Safely format a date-like value. Falls back to a dash when the input is
 * missing or unparseable so the UI never shows "Invalid Date".
 */
export function safeFormatDate(
  value: unknown,
  fallback = "—",
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString("en-US", opts);
}

export function safeFormatTime(
  value: unknown,
  fallback = "—",
  opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleTimeString("en-US", opts);
}

/**
 * Returns the relative phrase ("2 hours ago", "in 3 days") for a date string.
 * Returns the fallback if the value is missing or invalid.
 */
export function safeFromNow(
  value: unknown,
  fallback = "—",
  opts: Intl.RelativeTimeFormatOptions = { numeric: "auto" }
): string {
  const d = toDate(value);
  if (!d) return fallback;
  const diffMs = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("en", opts);
  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  if (abs < minute) return rtf.format(Math.round(diffMs / 1000), "second");
  if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (abs < week) return rtf.format(Math.round(diffMs / day), "day");
  if (abs < month) return rtf.format(Math.round(diffMs / week), "week");
  if (abs < year) return rtf.format(Math.round(diffMs / month), "month");
  return rtf.format(Math.round(diffMs / year), "year");
}

/**
 * Format a Prisma `Time` value ("03:00:00.000") for display.
 * Returns `fallback` when the value is missing or unparseable.
 * Use this anywhere the API returns a Time-only field so we never render
 * raw "HH:MM:SS.fff" noise.
 */
export function formatTimeOfDay(
  value: unknown,
  fallback = "—",
  opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }
): string {
  if (value == null) return fallback;
  const str = String(value).trim();
  if (!str) return fallback;

  // Prisma `Time` value: "HH:MM", "HH:MM:SS", or "HH:MM:SS.fff"
  const m = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) {
    // Fall back to the generic date formatter for any other shape.
    const d = toDate(str);
    if (!d) return fallback;
    return d.toLocaleTimeString("en-US", opts);
  }
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback;

  // Build a Date using today's date so the locale formatter behaves correctly.
  const ref = new Date();
  ref.setHours(hours, minutes, 0, 0);
  return ref.toLocaleTimeString("en-US", opts);
}
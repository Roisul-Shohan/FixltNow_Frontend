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
 */
export function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  const str = String(value).trim();
  if (!str || str === "null" || str === "undefined") return null;
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
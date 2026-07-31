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
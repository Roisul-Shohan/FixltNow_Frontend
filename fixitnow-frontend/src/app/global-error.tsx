"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0b0f17",
          color: "#e5e7eb",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(239,68,68,0.12)",
              color: "#f87171",
              marginBottom: 20,
            }}
          >
            <AlertTriangle size={32} aria-hidden />
          </div>
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontSize: 12,
              color: "#f87171",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            500 — Something broke
          </p>
          <h1 style={{ fontSize: 28, margin: "0 0 12px", fontWeight: 700 }}>
            We hit an unexpected error.
          </h1>
          <p style={{ color: "#9ca3af", marginBottom: 24 }}>
            Our team has been notified. You can retry the page or head back home
            to continue.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                background: "#10b981",
                color: "#062a1f",
                border: 0,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                background: "transparent",
                color: "#e5e7eb",
                border: "1px solid #374151",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Back to home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

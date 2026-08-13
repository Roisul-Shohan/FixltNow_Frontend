"use client";

import { useEffect } from "react";

import { CustomerSidebar } from "@/components/customer/sidebar";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { useAuthStore } from "@/hooks/use-auth-store";

/**
 * Shared chrome for every /services/* page.
 *
 * The customer sidebar is only shown when a CUSTOMER is signed in:
 *   • Guests         → navbar + footer only (clean public marketing view).
 *   • CUSTOMER       → full dashboard-style chrome with the sidebar.
 *   • TECHNICIAN     → navbar + footer only (they manage services under /tech
 *                      and shouldn't see the customer workspace).
 *   • ADMIN          → navbar + footer only.
 *
 * We hydrate the auth store on first mount so the very first render on a
 * signed-in reload still has the user object — otherwise the sidebar would
 * flash in for a frame and then disappear.
 */
export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const loadMe = useAuthStore((s) => s.loadMe);

  useEffect(() => {
    if (!initialized) loadMe();
  }, [initialized, loadMe]);

  const showCustomerSidebar = !!user && user.role === "CUSTOMER";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <div className="aurora-bg" aria-hidden="true" />

      <main className="relative flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 hero-overlay"
        />

        {showCustomerSidebar ? (
          <div className="flex flex-col xl:flex-row xl:items-start">
            {/* Sticky sidebar — same positioning as the dashboard layout. */}
            <CustomerSidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        ) : (
          // Guest / non-customer: render the page full-width inside the
          // public container so the detail/listing cards expand edge-to-edge.
          <div className="min-w-0 flex-1">{children}</div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
import { CustomerSidebar } from "@/components/customer/sidebar";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";

/**
 * Shared chrome for every /services/* page.
 *
 * Mirrors (public)/dashboard/layout.tsx so the customer sidebar stays
 * visible on the public-facing services pages too. We don't gate on
 * auth or role here — /services is publicly browsable, and the
 * CustomerSidebar gracefully shows a guest placeholder when no user
 * is logged in. The auth/role redirect that (public)/dashboard needs
 * stays in that layout.
 */
export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <div className="aurora-bg" aria-hidden="true" />

      <main className="relative flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 hero-overlay"
        />

        <div className="flex flex-col xl:flex-row xl:items-start">
          {/* Sidebar shows at xl+ so it doesn't crowd the in-page
              services filter rail on md–lg screens. On smaller screens
              the sidebar collapses into a top-of-page menu (handled by
              CustomerSidebar's own mobile toggle). */}
          <CustomerSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
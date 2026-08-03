"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { useAuthStore } from "@/hooks/use-auth-store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const loadMe = useAuthStore((s) => s.loadMe);

  // Hydrate the auth store on first mount
  useEffect(() => {
    if (!initialized) loadMe();
  }, [initialized, loadMe]);

  // Wrong role → push to right dashboard; not logged in → /login
  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    if (!user) {
      router.replace("/login?next=/admin");
    } else if (user.role === "CUSTOMER") {
      router.replace("/dashboard");
    } else if (user.role === "TECHNICIAN") {
      router.replace("/tech");
    }
  }, [initialized, user, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <div className="aurora-bg" aria-hidden="true" />

      <main className="relative flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 hero-overlay"
        />

        <div className="flex flex-col lg:flex-row lg:items-start">
          {/* Sidebar sits flush against the page's left edge; sticky just below the header. */}
          <AdminSidebar />
          <div className="min-w-0 flex-1 px-4 md:px-6 py-6 md:py-8 lg:pl-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

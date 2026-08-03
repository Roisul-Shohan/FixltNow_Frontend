"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  Star,
  User as UserIcon,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Optional sub-paths that should also count as "active" for this item. */
  matchPrefixes?: string[];
  /** Optional numeric badge rendered to the right of the label. */
  badge?: number;
};

const NAV: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    matchPrefixes: ["/dashboard"],
  },
  {
    label: "Book a service",
    href: "/services",
    icon: ShoppingBag,
    matchPrefixes: ["/services"],
  },
  {
    label: "My bookings",
    href: "/dashboard/bookings",
    icon: CalendarDays,
    matchPrefixes: ["/dashboard/bookings"],
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    matchPrefixes: ["/dashboard/payments"],
  },
  {
    label: "My reviews",
    href: "/dashboard/reviews",
    icon: Star,
    matchPrefixes: ["/dashboard/reviews"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: UserIcon,
    matchPrefixes: ["/dashboard/profile"],
  },
];

function isActive(item: NavItem, pathname: string): boolean {
  // Overview only highlights when we're exactly on the dashboard root.
  if (item.href === "/dashboard") return pathname === "/dashboard";
  if (pathname === item.href) return true;
  if (item.matchPrefixes) {
    return item.matchPrefixes.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
  }
  return false;
}

export function CustomerSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  const firstName = (user?.name ?? "").split(" ")[0] || "Customer";
  const initial = (user?.name ?? "C").charAt(0).toUpperCase();

  // Lightweight fetch — only used to drive the "due payments" badge on the
  // Payments nav item. We never render the rows themselves here, so a
  // generous limit is fine and the response is cached/shared with the bookings
  // page via the same query key.
  const { data: bookingsData } = useQuery<any>({
    queryKey: ["customer-bookings", "ALL"],
    queryFn: async () =>
      (await api.get("/bookings", { params: { limit: 100 } })).data,
    staleTime: 30_000,
  });

  const dueCount = useMemo(() => {
    const arr = bookingsData?.data;
    const list: Array<{ status?: string; payment?: { status?: string } }> =
      Array.isArray(arr) ? arr : Array.isArray(arr?.data) ? arr.data : [];
    return list.filter(
      (b) =>
        b?.status === "ACCEPTED" && b?.payment?.status !== "PAID"
    ).length;
  }, [bookingsData]);

  const handleLogout = () => {
    logout();
    if (typeof window !== "undefined") window.location.href = "/";
  };

  return (
    <>
      {/* Mobile toggle — only visible < lg */}
      <div className="lg:hidden sticky top-0 z-30 -mx-4 mb-4 flex items-center justify-between gap-2 border-b bg-background/80 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-sm font-bold">
            {initial}
          </div>
          <div className="text-sm">
            <div className="font-semibold leading-tight">{firstName}</div>
            <div className="text-xs text-muted-foreground leading-tight">
              Customer workspace
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span className="ml-1.5">{open ? "Close" : "Menu"}</span>
        </Button>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 flex h-full w-72 flex-col border-r bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto p-5">
              <SidebarBody
                pathname={pathname}
                userName={user?.name}
                initial={initial}
                dueCount={dueCount}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <div className="border-t bg-card p-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar — sticky just under the navbar, flush with page left edge */}
      <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-16 lg:self-start w-64 shrink-0 border-r bg-card lg:h-[calc(100vh-4rem)]">
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <SidebarBody
            pathname={pathname}
            userName={user?.name}
            initial={initial}
            dueCount={dueCount}
          />
        </div>
        <div className="border-t bg-card px-4 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}

function SidebarBody({
  pathname,
  userName,
  initial,
  dueCount = 0,
  onNavigate,
}: {
  pathname: string;
  userName?: string;
  initial: string;
  dueCount?: number;
  onNavigate?: () => void;
}) {
  // Build the navigation list at render time so the Payments item picks up
  // the latest due-count from the bookings query.
  const navItems: NavItem[] = NAV.map((item) =>
    item.href === "/dashboard/payments" ? { ...item, badge: dueCount } : item
  );

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-bold">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{userName ?? "Customer"}</div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" />
            Customer workspace
          </div>
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-1" aria-label="Customer navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, pathname);
          const badge = item.badge ?? 0;
          const showBadge = badge > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {showBadge ? (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-rose-500 text-white"
                  )}
                  aria-label={`${badge} due payments`}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

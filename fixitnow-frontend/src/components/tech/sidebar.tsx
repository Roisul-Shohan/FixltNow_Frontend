"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Banknote,
  Briefcase,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Star,
  User as UserIcon,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Optional sub-paths that should also count as "active" for this item. */
  matchPrefixes?: string[];
};

const NAV: NavItem[] = [
  {
    label: "Overview",
    href: "/tech",
    icon: LayoutDashboard,
    matchPrefixes: ["/tech"],
  },
  {
    label: "Bookings",
    href: "/tech/bookings",
    icon: CalendarDays,
    matchPrefixes: ["/tech/bookings"],
  },
  {
    label: "Availability",
    href: "/tech/availability",
    icon: Settings2,
    matchPrefixes: ["/tech/availability"],
  },
  {
    label: "Services",
    href: "/tech/services",
    icon: Wrench,
    matchPrefixes: ["/tech/services"],
  },
  {
    label: "Reviews",
    href: "/tech/reviews",
    icon: Star,
    matchPrefixes: ["/tech/reviews"],
  },
  {
    label: "Earnings",
    href: "/tech/earnings",
    icon: Banknote,
    matchPrefixes: ["/tech/earnings"],
  },
  {
    label: "Customers",
    href: "/tech/customers",
    icon: Users,
    matchPrefixes: ["/tech/customers"],
  },
  {
    label: "Profile",
    href: "/tech/profile",
    icon: UserIcon,
    matchPrefixes: ["/tech/profile"],
  },
];

function isActive(item: NavItem, pathname: string): boolean {
  // Overview is special: it's the root /tech AND /tech/* — but we want
  // the matching sub-route to win. So Overview is only active when the
  // pathname is exactly /tech.
  if (item.href === "/tech") return pathname === "/tech";
  if (pathname === item.href) return true;
  if (item.matchPrefixes) {
    return item.matchPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return false;
}

export function TechSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  const firstName = (user?.name ?? "").split(" ")[0] || "Technician";
  const initial = (user?.name ?? "T").charAt(0).toUpperCase();

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
              Technician workspace
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
          <SidebarBody pathname={pathname} userName={user?.name} initial={initial} />
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
  onNavigate,
}: {
  pathname: string;
  userName?: string;
  initial: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white font-bold">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{userName ?? "Technician"}</div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            Technician workspace
          </div>
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-1" aria-label="Technician navigation">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, pathname);
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
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

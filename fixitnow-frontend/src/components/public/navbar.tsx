"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { Wrench, User as UserIcon, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

export function PublicNavbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardHref = user?.role === "ADMIN" ? "/admin" : user?.role === "TECHNICIAN" ? "/tech" : "/dashboard";
  const isOnDashboard = pathname === dashboardHref;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Fix<span className="text-primary">It</span>Now
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/services">Services</NavLink>
          <NavLink href="/technicians">Technicians</NavLink>
          <NavLink href="/categories">Categories</NavLink>
          <NavLink href="/about">About</NavLink>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              {!isOnDashboard ? (
                <Button variant="ghost" asChild>
                  <Link href={dashboardHref}>
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </Button>
              ) : null}
              <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-xs">
                  {user.name?.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5">{user.role}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={async () => { await logout(); router.push("/"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="gradient" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t bg-background overflow-hidden"
          >
            <div className="container py-4 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 mb-1 border-b">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Theme
                </span>
                <ThemeToggle />
              </div>
              <MobileLink href="/services" onClick={() => setOpen(false)}>Services</MobileLink>
              <MobileLink href="/technicians" onClick={() => setOpen(false)}>Technicians</MobileLink>
              <MobileLink href="/categories" onClick={() => setOpen(false)}>Categories</MobileLink>
              {user ? (
                <>
                  {!isOnDashboard ? (
                    <MobileLink href={dashboardHref} onClick={() => setOpen(false)}>Dashboard</MobileLink>
                  ) : null}
                  <Button variant="outline" onClick={async () => { await logout(); setOpen(false); router.push("/"); }}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline"><Link href="/login" onClick={() => setOpen(false)}>Login</Link></Button>
                  <Button asChild variant="gradient"><Link href="/register" onClick={() => setOpen(false)}>Get Started</Link></Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
    >
      {children}
    </Link>
  );
}
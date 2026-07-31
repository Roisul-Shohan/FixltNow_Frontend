import Link from "next/link";
import { Wrench, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t bg-card/30 mt-24">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 text-white shadow-lg shadow-primary/30">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">Fix<span className="text-primary">It</span>Now</span>
            </Link>
            <p className="text-sm text-muted-foreground mt-3">
              Trusted home services, on demand. Verified technicians, transparent pricing.
            </p>
            <div className="flex gap-3 mt-4">
              <SocialIcon><Facebook className="h-4 w-4" /></SocialIcon>
              <SocialIcon><Twitter className="h-4 w-4" /></SocialIcon>
              <SocialIcon><Instagram className="h-4 w-4" /></SocialIcon>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/services" className="hover:text-foreground">Services</Link></li>
              <li><Link href="/technicians" className="hover:text-foreground">Technicians</Link></li>
              <li><Link href="/categories" className="hover:text-foreground">Categories</Link></li>
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground">Login</Link></li>
              <li><Link href="/register" className="hover:text-foreground">Register</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-foreground">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@fixitnow.com</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +880 1700-000000</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Dhaka, Bangladesh</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FixItNow. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ children }: { children: React.ReactNode }) {
  return (
    <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full border bg-background hover:bg-accent transition-colors">
      {children}
    </a>
  );
}
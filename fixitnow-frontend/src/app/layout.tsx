import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// The whole app is auth-gated, client-driven, and depends on a live API at
// request time — opt out of static prerender so `next build` doesn't block on
// reaching the backend to pre-generate every route.
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "FixItNow — Trusted Home Services, On Demand",
  description:
    "Book verified technicians for plumbing, electrical, cleaning, AC repair and more. Fast, transparent, and secure.",
};

const themeScript = `
(function() {
  try {
    var stored = window.localStorage.getItem('fixitnow-theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

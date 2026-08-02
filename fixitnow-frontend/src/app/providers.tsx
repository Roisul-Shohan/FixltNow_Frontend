"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { ThemeProvider, useTheme } from "@/hooks/use-theme";
import { LightRays } from "@/components/light-rays";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
    },
  }));

  const loadMe = useAuthStore((s) => s.loadMe);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) loadMe();
  }, [initialized, loadMe]);

  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        {/*
          Global fixed background. Sits behind page content but in front of
          the body::before wash (z = -3) and aurora-bg (z = -2) so the rays
          are never covered by them. Doesn't capture pointer events, so it
          never blocks clicks/forms. Once per app — no need to drop
          <LightRays> into individual pages.

          Light mode: rays are skipped entirely — they were washing out the
          light surfaces and looked like a hard separator at the bottom.
          Dark mode only.
        */}
        <DarkOnlyRays />
        <ThemedToaster />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function DarkOnlyRays() {
  const { resolvedTheme } = useTheme();
  if (resolvedTheme !== "dark") return null;
  return (
    <div
      aria-hidden
      className="light-rays-fade fixed inset-0 -z-[1] pointer-events-none"
    >
      <LightRays
        raysOrigin="top-center"
        raysColor="#5eead4"
        raysSpeed={0.55}
        lightSpread={0.8}
        rayLength={1.5}
        pulsating={false}
        fadeDistance={1.0}
        saturation={1}
        followMouse
        mouseInfluence={0.08}
        noiseAmount={0.05}
        distortion={0.05}
      />
    </div>
  );
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster richColors position="top-right" theme={resolvedTheme} />;
}
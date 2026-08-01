"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { ThemeProvider, useTheme } from "@/hooks/use-theme";

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
        <ThemedToaster />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster richColors position="top-right" theme={resolvedTheme} />;
}
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  initialized: boolean;
  setUser: (u: User | null) => void;
  /**
   * Replace the access / refresh token pair without touching `user`.
   * Used by the api.ts interceptor after a successful refresh.
   */
  setTokens: (token: string, refreshToken: string | null) => void;
  loadMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      initialized: false,
      setUser: (u) => set({ user: u }),
      setTokens: (token, refreshToken) =>
        set({ token, refreshToken }),
      loadMe: async () => {
        try {
          set({ loading: true });

          // If we don't have an access token but DO have a refresh token,
          // try to refresh proactively so the user doesn't see a brief
          // logged-out flash before the request interceptor catches up.
          if (typeof window !== "undefined") {
            try {
              const raw = window.localStorage.getItem("fixitnow-auth");
              const parsed = raw ? JSON.parse(raw) : null;
              const hasAccess = !!(parsed?.state?.token || parsed?.token);
              const hasRefresh = !!(
                parsed?.state?.refreshToken || parsed?.refreshToken
              );
              if (!hasAccess && hasRefresh) {
                const { refreshAccessToken } = await import("@/lib/api");
                await refreshAccessToken();
              }
            } catch {
              /* ignore — fall through to /auth/me */
            }
          }

          const res = await api.get("/auth/me");
          const u = res.data?.data ?? res.data;
          set({ user: u, initialized: true, loading: false });
        } catch {
          // Only clear the user if the refresh token is also dead.
          // The response interceptor handles transient 401s; if we land
          // here, the refresh token is gone or the server rejected the
          // session entirely.
          let refreshDead = true;
          if (typeof window !== "undefined") {
            try {
              const { refreshAccessToken } = await import("@/lib/api");
              const ok = await refreshAccessToken();
              if (ok) {
                // Refresh worked — try /auth/me one more time before giving up.
                try {
                  const res2 = await api.get("/auth/me");
                  const u2 = res2.data?.data ?? res2.data;
                  set({ user: u2, initialized: true, loading: false });
                  refreshDead = false;
                  return;
                } catch {
                  /* fall through to clear */
                }
              }
            } catch {
              /* fall through to clear */
            }
          }
          if (refreshDead) {
            set({ user: null, initialized: true, loading: false });
          }
        }
      },
      login: async (email, password) => {
        const res = await api.post("/auth/login", { email, password });
        const payload = res.data?.data ?? res.data;
        const user = payload?.user ?? payload;
        const token = payload?.accessToken ?? null;
        const refreshToken = payload?.refreshToken ?? null;
        set({ user, token, refreshToken });
        return user;
      },
      register: async (payload) => {
        const res = await api.post("/auth/register", payload);
        const data = res.data?.data ?? res.data;
        const user = data?.user ?? data;
        const token = data?.accessToken ?? null;
        const refreshToken = data?.refreshToken ?? null;
        set({ user, token, refreshToken });
        return user;
      },
      logout: async () => {
        try { await api.post("/auth/logout"); } catch {}
        set({ user: null, token: null, refreshToken: null });
      },
    }),
    {
      name: "fixitnow-auth",
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        refreshToken: s.refreshToken,
      }),
    }
  )
);
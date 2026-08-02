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
          const res = await api.get("/auth/me");
          const u = res.data?.data ?? res.data;
          set({ user: u, initialized: true, loading: false });
        } catch {
          set({ user: null, initialized: true, loading: false });
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
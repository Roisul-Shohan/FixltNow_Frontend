"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (u: User | null) => void;
  loadMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      initialized: false,
      setUser: (u) => set({ user: u }),
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
        const user = res.data?.data?.user ?? res.data?.data ?? res.data;
        set({ user });
        return user;
      },
      register: async (payload) => {
        const res = await api.post("/auth/register", payload);
        const user = res.data?.data?.user ?? res.data?.data ?? res.data;
        set({ user });
        return user;
      },
      logout: async () => {
        try { await api.post("/auth/logout"); } catch {}
        set({ user: null });
      },
    }),
    { name: "fixitnow-auth", partialize: (s) => ({ user: s.user }) }
  )
);
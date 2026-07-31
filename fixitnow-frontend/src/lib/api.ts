import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://fixlit-now.vercel.app/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// In-memory flag to avoid refresh-token loops
let isRefreshing = false;
let pendingQueue: Array<(token?: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry && !original.url?.includes("/auth/")) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve());
        }).then(() => api(original));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await axios.get(`${API_BASE}/auth/refresh`, { withCredentials: true });
        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];
        return api(original);
      } catch (e) {
        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];
        throw e;
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Server-side fetch helper (RSC) with cookie forwarding
export async function serverFetch(path: string, init: RequestInit = {}) {
  const { headers, ...rest } = init;
  const res = await fetch(`${API_BASE.replace("/api", "")}${path.startsWith("/api") ? path : `/api${path}`}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(headers as any) },
    credentials: "include",
    cache: "no-store",
  });
  return res;
}
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://fixlit-now.vercel.app/api";

// Note: We use Bearer token auth (Authorization header), NOT cookies.
// Setting withCredentials:true forces a CORS preflight that the backend
// does not currently satisfy (no Access-Control-Allow-Credentials header).
// We attach the token via the request interceptor below.
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach JWT from localStorage / zustand persist on every request.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("fixitnow-auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token || parsed?.token;
        if (token) {
          config.headers = config.headers ?? {};
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore
    }
  }
  return config;
});

// In-memory flag to avoid refresh-token loops
let isRefreshing = false;
let pendingQueue: Array<(token?: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve());
        }).then(() => api(original));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        // Try to refresh token. Use Bearer of the stored refresh token.
        const raw =
          typeof window !== "undefined" ? window.localStorage.getItem("fixitnow-auth") : null;
        const parsed = raw ? JSON.parse(raw) : null;
        const refresh = parsed?.state?.refreshToken || parsed?.refreshToken;
        await axios.post(`${API_BASE}/auth/refresh`, null, {
          headers: refresh ? { Authorization: `Bearer ${refresh}` } : undefined,
        });
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

// Server-side fetch helper (RSC) — credentials omitted, no cookies.
export async function serverFetch(path: string, init: RequestInit = {}) {
  const { headers, ...rest } = init;
  const base = API_BASE.replace(/\/api$/, "");
  const url = `${base}${path.startsWith("/api") ? path : `/api${path}`}`;
  const res = await fetch(url, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(headers as any) },
    cache: "no-store",
  });
  return res;
}
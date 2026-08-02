import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://fixlit-now.vercel.app/api";

// We use Bearer-token auth (Authorization header). The backend also writes
// `accessToken` / `refreshToken` as `httpOnly` cookies but those are not
// available to JS and not used by this client.
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Pull the access/refresh pair from the persisted zustand store on every
// request. Reading directly from localStorage keeps the interceptor
// independent from React.
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
      // ignore — interceptor must never throw
    }
  }
  return config;
});

// ────────────────────────────────────────────────────────────────────────────
// Refresh-token plumbing
// ────────────────────────────────────────────────────────────────────────────
//
// Goal: a single 401 anywhere in the app should transparently swap in a
// fresh access token (using the long-lived refresh token) and retry the
// original request. Only when the refresh token itself is rejected do we
// give up — and even then we don't redirect; the calling code decides.
//
// Concurrency: if several requests fail with 401 at the same time they
// share a single in-flight refresh call. Subsequent callers wait on a
// promise that resolves when the new access token is available.

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

interface RefreshResult {
  token: string;
  refreshToken: string | null;
}

async function refreshAccessToken(): Promise<RefreshResult | null> {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("fixitnow-auth");
  if (!raw) return null;
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const refresh = parsed?.state?.refreshToken || parsed?.refreshToken;
  if (!refresh) return null;

  try {
    // Use raw axios (NOT the `api` instance) so the response interceptor
    // doesn't run on the refresh call itself — would loop forever.
    const res = await axios.post(
      `${API_BASE}/auth/refresh-token`,
      { refreshToken: refresh },
      { headers: { "Content-Type": "application/json" }, timeout: 30000 }
    );
    const data = res.data?.data ?? res.data;
    const token = data?.accessToken ?? null;
    const newRefresh = data?.refreshToken ?? refresh;
    if (!token) return null;

    // Persist new tokens. Reading through localStorage avoids a circular
    // dependency on the zustand store.
    try {
      const next = { ...parsed };
      next.state = { ...(parsed.state ?? {}), token, refreshToken: newRefresh };
      window.localStorage.setItem("fixitnow-auth", JSON.stringify(next));
    } catch {
      // ignore — token may still be in-memory for the rest of this tab
    }
    return { token, refreshToken: newRefresh };
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (!original) return Promise.reject(error);

    const status = error.response?.status;
    const isAuthRoute = (original.url ?? "").includes("/auth/");

    if (status !== 401 || original._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    original._retry = true;

    // If a refresh is already in flight, queue this call and wait for it.
    if (isRefreshing) {
      await new Promise<void>((resolve) => {
        pendingQueue.push(resolve);
      });
      // After the in-flight refresh settles, retry with the freshly-stored
      // access token (the request interceptor will pick it up).
      original.headers = original.headers ?? ({} as any);
      (original.headers as any).Authorization = `Bearer ${readToken()}`;
      return api(original);
    }

    isRefreshing = true;
    try {
      const result = await refreshAccessToken();
      // Always wake queued callers, even on failure — they each get to
      // re-decide based on the error from their retry attempt.
      pendingQueue.forEach((cb) => cb());
      pendingQueue = [];

      if (!result) {
        return Promise.reject(error);
      }

      original.headers = original.headers ?? ({} as any);
      (original.headers as any).Authorization = `Bearer ${result.token}`;
      return api(original);
    } finally {
      isRefreshing = false;
    }
  }
);

function readToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem("fixitnow-auth");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.state?.token || parsed?.token || undefined;
  } catch {
    return undefined;
  }
}

// Server-side fetch helper (RSC) — no cookies, no interceptors.
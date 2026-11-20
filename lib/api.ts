"use client";

/**
 * Thin fetch wrapper for the HRMS API.
 *
 * - Keeps the access/refresh token pair in localStorage.
 * - Attaches the Bearer token on every request.
 * - On a 401 it refreshes once (single-flight), then retries the request.
 * - Unwraps the `{ success, data }` envelope and throws ApiError otherwise.
 * - Emits `AUTH_EVENT` whenever the token pair changes so the AuthProvider
 *   can react (e.g. sign the user out when the refresh token is rejected).
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1").replace(/\/+$/, "");

const ACCESS_KEY = "hrms.auth.accessToken";
const REFRESH_KEY = "hrms.auth.refreshToken";

/** Fired on the window whenever the stored token pair changes. */
export const AUTH_EVENT = "hrms:auth-change";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/* ---------------- token storage ---------------- */

function notifyAuthChange(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: TokenPair): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  notifyAuthChange();
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  notifyAuthChange();
}

/* ---------------- request plumbing ---------------- */

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Send the Bearer token (default true). */
  auth?: boolean;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  details?: unknown;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = auth ? getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/**
 * In-flight refresh, shared by every caller. Without this, several requests
 * that 401 at the same time would each rotate the refresh token and the
 * later rotations would invalidate the earlier ones (spurious sign-outs).
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      const res = await send("/auth/refresh", { method: "POST", body: { refreshToken }, auth: false });
      if (!res.ok) return false;

      const payload = (await res.json()) as Envelope<{ tokens: TokenPair }>;
      if (!payload.data?.tokens) return false;

      setTokens(payload.data.tokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions, retry = true): Promise<T> {
  let res = await send(path, options);

  if (res.status === 401 && options.auth !== false && retry && (await refreshTokens())) {
    res = await send(path, options);
  }

  const payload = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok) {
    // A 401 after the refresh attempt means the session is gone for good.
    if (res.status === 401) clearTokens();
    throw new ApiError(res.status, payload?.message ?? `Request failed (${res.status})`, payload?.details);
  }

  return (payload?.data ?? payload) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

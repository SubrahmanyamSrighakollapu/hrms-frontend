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

/** Full API base URL including the version prefix (e.g. `http://host/api/v1`). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1").replace(/\/+$/, "");

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
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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

/**
 * Multipart upload. Shares the 401-refresh flow with `request` but lets the
 * browser set the `Content-Type` (with the multipart boundary) itself.
 */
async function requestForm<T>(path: string, form: FormData, retry = true): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: form });

  if (res.status === 401 && retry && (await refreshTokens())) {
    const retryHeaders: Record<string, string> = {};
    const nextToken = getAccessToken();
    if (nextToken) retryHeaders.Authorization = `Bearer ${nextToken}`;
    res = await fetch(`${API_URL}${path}`, { method: "POST", headers: retryHeaders, body: form });
  }

  const payload = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok) {
    if (res.status === 401) clearTokens();
    throw new ApiError(res.status, payload?.message ?? `Upload failed (${res.status})`, payload?.details);
  }

  return (payload?.data ?? payload) as T;
}

async function downloadFile(path: string, retry = true): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${path}`, { headers });
  if (res.status === 401 && retry && (await refreshTokens())) {
    const nextToken = getAccessToken();
    res = await fetch(`${API_URL}${path}`, {
      headers: nextToken ? { Authorization: `Bearer ${nextToken}` } : {},
    });
  }

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as Envelope<unknown> | null;
    if (res.status === 401) clearTokens();
    throw new ApiError(res.status, payload?.message ?? `Download failed (${res.status})`, payload?.details);
  }
  return res.blob();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) => requestForm<T>(path, form),
  download: (path: string) => downloadFile(path),
};

// ---------------------------------------------------------------------------
// Thin HTTP client for the aasPass NestJS backend.
//
// The backend never issues tokens — the caller signs in with Supabase Auth and
// we forward the access token as `Authorization: Bearer <token>` on every call.
// When no backend URL / token is configured the app runs in demo mode and all
// state stays local (the store falls back automatically).
// ---------------------------------------------------------------------------

import { getConnection } from "./config";

const getBaseUrl = () => getConnection().apiUrl;

/** Set by the auth layer whenever a Supabase session is available. */
let accessToken: string | null = null;
export const setApiAccessToken = (token: string | null) => {
  accessToken = token;
};

/** True when the app can talk to the real backend. */
export const isBackendConfigured = () => Boolean(getBaseUrl() && accessToken);

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new ApiError(0, "Backend URL not configured");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as { message?: string | string[] } | null)?.message;
    throw new ApiError(
      response.status,
      Array.isArray(message) ? message.join(", ") : (message ?? response.statusText),
    );
  }
  return body as T;
}

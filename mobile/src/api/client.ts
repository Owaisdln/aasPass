// ---------------------------------------------------------------------------
// Thin HTTP client for the aasPass NestJS backend.
// Pure fetch, React Native compatible.
// ---------------------------------------------------------------------------

import { getConnection } from "./config";

const getBaseUrl = () => getConnection().apiUrl;

/** Set by the auth layer whenever a Supabase session is available. */
let accessToken: string | null = null;
export const setApiAccessToken = (token: string | null) => { accessToken = token; };

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
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw new ApiError(
      0,
      `Cannot reach the backend at ${baseUrl}. Check that the server is running and reachable from this device. Physical phones must use the computer's LAN IP instead of localhost.${detail}`,
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body as { message?: string | string[] } | null)?.message;
    throw new ApiError(response.status, Array.isArray(message) ? message.join(", ") : message ?? response.statusText);
  }
  return body as T;
}

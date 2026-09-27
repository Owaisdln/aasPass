// ---------------------------------------------------------------------------
// Users API — mirrors the backend UsersModule exactly.
// ---------------------------------------------------------------------------

import { apiFetch } from "./client";

export type UserResponse = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
};

export type UserSessionResponse = {
  id: string;
  deviceType: string;
  browser: string | null;
  os: string | null;
  lastActivityAt: string;
  createdAt: string;
  revokedAt: string | null;
};

export const getMe = () => apiFetch<UserResponse>("/users/me");

export const updateMe = (body: { firstName?: string; lastName?: string }) =>
  apiFetch<UserResponse>("/users/me", { method: "PATCH", body: JSON.stringify(body) });

export const listMySessions = () => apiFetch<UserSessionResponse[]>("/users/me/sessions");

export const revokeMySession = (sessionId: string) =>
  apiFetch<void>(`/users/me/sessions/${sessionId}`, { method: "DELETE" });

export const revokeAllMySessions = () => apiFetch<void>("/users/me/sessions", { method: "DELETE" });

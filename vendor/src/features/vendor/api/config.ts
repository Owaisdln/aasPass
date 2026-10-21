// ---------------------------------------------------------------------------
// Connection settings for the live aasPass backend.
//
// The backend runs wherever the team hosts it (localhost during development,
// a tunnel / server URL for demos), and authentication is handled by the
// team's own Supabase project. Both are configurable at runtime from the
// in-app Connection screen so a demo can be pointed at any environment
// without a rebuild. Environment variables provide the defaults.
// ---------------------------------------------------------------------------

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type Connection = {
  /** Base URL of the NestJS API, e.g. http://localhost:3000 */
  apiUrl: string;
  /** Supabase project URL used for sign-in. */
  supabaseUrl: string;
  /** Supabase publishable (anon) key. */
  supabaseAnonKey: string;
};

const STORAGE_KEY = "aaspass.vendor.connection.v1";

const envValue = (value: string | undefined) => (value ?? "").trim();
const normalizeApiUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/$/, "");
  if (Platform.OS !== "android") return trimmed;
  return trimmed.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
};

const envConnection = (): Connection => ({
  apiUrl: normalizeApiUrl(envValue(process.env.EXPO_PUBLIC_AASPASS_API_URL)),
  supabaseUrl: envValue(process.env.EXPO_PUBLIC_AASPASS_SUPABASE_URL).replace(/\/$/, ""),
  supabaseAnonKey: envValue(process.env.EXPO_PUBLIC_AASPASS_SUPABASE_ANON_KEY),
});

let cached: Connection = envConnection();
let hydrated = false;
const listeners = new Set<() => void>();

export const getConnection = (): Connection => cached;

export const hydrateConnection = async () => {
  if (hydrated) return cached;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const stored = JSON.parse(raw) as Partial<Connection>;
      const env = envConnection();
      cached = {
        apiUrl: normalizeApiUrl(stored.apiUrl ?? env.apiUrl),
        supabaseUrl: (stored.supabaseUrl ?? env.supabaseUrl).replace(/\/$/, ""),
        supabaseAnonKey: stored.supabaseAnonKey ?? env.supabaseAnonKey,
      };
    } catch (error) {
      throw new Error("Saved connection settings could not be read", { cause: error });
    }
  }
  hydrated = true;
  return cached;
};

export const saveConnection = async (next: Partial<Connection>) => {
  const merged: Connection = {
    ...cached,
    ...next,
  };
  merged.apiUrl = normalizeApiUrl(merged.apiUrl);
  merged.supabaseUrl = merged.supabaseUrl.trim().replace(/\/$/, "");
  merged.supabaseAnonKey = merged.supabaseAnonKey.trim();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  cached = merged;
  listeners.forEach((listener) => listener());
  return merged;
};

export const resetConnection = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  cached = envConnection();
  hydrated = true;
  listeners.forEach((listener) => listener());
  return cached;
};

export const onConnectionChange = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** True when API calls can be attempted. */
export const isApiConfigured = () => Boolean(getConnection().apiUrl);
/** True when real Supabase sign-in is available. */
export const isAuthConfigured = () => {
  const connection = getConnection();
  return Boolean(connection.supabaseUrl && connection.supabaseAnonKey);
};

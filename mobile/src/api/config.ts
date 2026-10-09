// ---------------------------------------------------------------------------
// Connection settings for the live aasPass backend.
// Configurable at runtime from the in-app Connection screen.
// Uses AsyncStorage for React Native.
// ---------------------------------------------------------------------------

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type Connection = {
  /** Base URL of the NestJS API, e.g. http://10.0.2.2:3000 or production URL */
  apiUrl: string;
  /** Supabase project URL used for sign-in. */
  supabaseUrl: string;
  /** Supabase publishable (anon) key. */
  supabaseAnonKey: string;
};

const STORAGE_KEY = "aaspass.connection.v1";

const envValue = (name: string) => (process.env[name] ?? "").trim();

export const normalizeApiUrl = (url: string): string => {
  const trimmed = url.trim().replace(/\/$/, "");
  if (Platform.OS === "android") {
    return trimmed.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
  }
  return trimmed;
};

const envConnection = (): Connection => ({
  apiUrl: normalizeApiUrl(envValue("EXPO_PUBLIC_API_URL") || envValue("VITE_AASPASS_API_URL")),
  supabaseUrl: (envValue("EXPO_PUBLIC_SUPABASE_URL") || envValue("VITE_AASPASS_SUPABASE_URL")).replace(/\/$/, ""),
  supabaseAnonKey: envValue("EXPO_PUBLIC_SUPABASE_ANON_KEY") || envValue("VITE_AASPASS_SUPABASE_ANON_KEY"),
});

const isLocalApiUrl = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(url);

let cached: Connection = envConnection();
let isInitialized = false;
const listeners = new Set<() => void>();

export const initConnection = async (): Promise<Connection> => {
  if (isInitialized) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<Connection>;
      const env = envConnection();
      const storedApiUrl = (stored.apiUrl ?? env.apiUrl).replace(/\/$/, "");
      const storedIsLocal = isLocalApiUrl(storedApiUrl);
      const envIsConfigured = Boolean(env.apiUrl);
      const shouldUseEnvironmentUrl = envIsConfigured && storedApiUrl !== env.apiUrl && storedIsLocal;
      cached = {
        apiUrl: shouldUseEnvironmentUrl ? env.apiUrl : storedApiUrl,
        supabaseUrl: (stored.supabaseUrl ?? env.supabaseUrl).replace(/\/$/, ""),
        supabaseAnonKey: stored.supabaseAnonKey ?? env.supabaseAnonKey,
      };
      if (cached.apiUrl !== storedApiUrl) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
      }
    }
  } catch {
    // fallback to env
  }
  isInitialized = true;
  listeners.forEach((listener) => listener());
  return cached;
};

export const getConnection = (): Connection => cached;

export const saveConnection = async (next: Partial<Connection>): Promise<Connection> => {
  const merged: Connection = {
    ...getConnection(),
    ...next,
  };
  merged.apiUrl = normalizeApiUrl(merged.apiUrl);
  merged.supabaseUrl = merged.supabaseUrl.trim().replace(/\/$/, "");
  merged.supabaseAnonKey = merged.supabaseAnonKey.trim();
  cached = merged;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage failure
  }
  listeners.forEach((listener) => listener());
  return merged;
};

export const resetConnection = async (): Promise<Connection> => {
  cached = envConnection();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failure
  }
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

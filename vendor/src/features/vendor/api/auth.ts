// Vendor sign-in. Three ways in:
//  1. Supabase email + password (the backend verifies the Supabase token)
//  2. Backend demo accounts: GET /auth/demo-users + POST /auth/demo-login
//  3. Offline sample store (no backend) for walkthroughs
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, setApiAccessToken } from "./client";
import { getConnection, isAuthConfigured } from "./config";

let client: SupabaseClient | null = null;
let clientKey = "";
let authSubscription: { unsubscribe: () => void } | null = null;

const getSupabase = () => {
  if (!isAuthConfigured()) return null;
  const { supabaseUrl, supabaseAnonKey } = getConnection();
  const key = `${supabaseUrl}|${supabaseAnonKey}`;
  if (!client || clientKey !== key) {
    authSubscription?.unsubscribe();
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "aaspass-vendor-auth",
        storage: AsyncStorage,
      },
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (session) setApiAccessToken(session.access_token);
    });
    authSubscription = data.subscription;
    clientKey = key;
  }
  return client;
};

export const signInWithPassword = async (email: string, password: string) => {
  const supabase = getSupabase();
  if (!supabase)
    throw new Error(
      "Email sign-in isn't set up yet. Add your sign-in details on the Connection screen.",
    );
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return { token: data.session.access_token, email: data.user.email ?? email };
};

export const refreshSupabaseToken = async () => {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

export type DemoUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};
export const listDemoUsers = () => apiFetch<DemoUser[]>("/auth/demo-users");
export const demoLogin = (email: string) =>
  apiFetch<{ access_token: string; user: { id: string; email: string } }>("/auth/demo-login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const signOutRemote = async () => {
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut().catch(() => undefined);
};

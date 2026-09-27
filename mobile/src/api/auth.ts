// ---------------------------------------------------------------------------
// Supabase authentication for React Native / Expo.
// ---------------------------------------------------------------------------

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConnection, isAuthConfigured } from "./config";
import { setApiAccessToken } from "./client";

let client: SupabaseClient | null = null;
let clientKey = "";

export const getSupabase = (): SupabaseClient | null => {
  if (!isAuthConfigured()) return null;
  const { supabaseUrl, supabaseAnonKey } = getConnection();
  const key = `${supabaseUrl}|${supabaseAnonKey}`;
  if (!client || clientKey !== key) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "aaspass-auth",
      },
    });
    clientKey = key;
  }
  return client;
};

/** Forget the cached client so new connection settings take effect. */
export const resetSupabase = () => {
  client = null;
  clientKey = "";
  setApiAccessToken(null);
};

const remember = (session: Session | null) => {
  setApiAccessToken(session?.access_token ?? null);
  return session;
};

/** Restores a persisted session on app start. */
export const restoreSession = async () => {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return remember(data.session ?? null);
};

export const signInWithPassword = async (email: string, password: string) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Sign-in is not configured yet");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return remember(data.session);
};

export const signUpWithPassword = async (email: string, password: string) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Sign-in is not configured yet");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return remember(data.session);
};

/** Sends an SMS OTP. Needs an SMS provider enabled on the Supabase project. */
export const sendPhoneOtp = async (phone: string) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Sign-in is not configured yet");
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw new Error(error.message);
};

export const verifyPhoneOtp = async (phone: string, token: string) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Sign-in is not configured yet");
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw new Error(error.message);
  return remember(data.session);
};

/** Sends an email OTP (magic-link style). */
export const sendEmailOtp = async (email: string) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Sign-in is not configured yet");
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw new Error(error.message);
};

export const verifyEmailOtp = async (email: string, token: string) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Sign-in is not configured yet");
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw new Error(error.message);
  return remember(data.session);
};

export const signOutRemote = async () => {
  const supabase = getSupabase();
  setApiAccessToken(null);
  if (!supabase) return;
  await supabase.auth.signOut().catch(() => undefined);
};

export const getSessionUser = async () => {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
};

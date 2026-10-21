declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_AASPASS_API_URL?: string;
    readonly EXPO_PUBLIC_AASPASS_SUPABASE_URL?: string;
    readonly EXPO_PUBLIC_AASPASS_SUPABASE_ANON_KEY?: string;
  }
}

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { setApiAccessToken } from "./api/client";
import type { VendorSession } from "./model";

type SessionState = {
  session: VendorSession | null;
  token: string | null;
  hydrated: boolean;
  signIn: (session: VendorSession, token?: string | null) => void;
  signOut: () => void;
};

const secureStorage = {
  getItem: (key: string) =>
    Platform.OS === "web" ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    Platform.OS === "web" ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  removeItem: (key: string) =>
    Platform.OS === "web" ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      token: null,
      hydrated: false,
      signIn: (session, token = null) => {
        setApiAccessToken(token);
        set({ session, token });
      },
      signOut: () => {
        setApiAccessToken(null);
        set({ session: null, token: null });
      },
    }),
    {
      name: "aaspass.vendor.session.v1",
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ session, token }) => ({ session, token }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) setApiAccessToken(state.token);
        useSession.setState({ hydrated: true });
      },
    },
  ),
);

export const isLive = () => useSession.getState().session?.mode === "live";

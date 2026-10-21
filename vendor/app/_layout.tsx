import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hydrateConnection } from "../src/features/vendor/api/config";
import { refreshSupabaseToken } from "../src/features/vendor/api/auth";
import { useSession } from "../src/features/vendor/session";
import { palette } from "../src/native/ui";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([hydrateConnection(), useSession.persist.rehydrate()])
      .then(async () => {
        if (!active) return;
        const { session, token } = useSession.getState();
        if (session?.mode === "live" && !token?.startsWith("demo.")) {
          const refreshedToken = await refreshSupabaseToken();
          const currentSession = useSession.getState().session;
          if (refreshedToken && currentSession?.mode === "live" && active) {
            useSession.getState().signIn(currentSession, refreshedToken);
          }
        }
        if (active) setReady(true);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "App setup failed");
      });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: palette.background,
          gap: 12,
        }}
      >
        {error ? (
          <Text style={{ color: palette.danger }}>{error}</Text>
        ) : (
          <ActivityIndicator size="large" color={palette.primary} />
        )}
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="connect" options={{ presentation: "modal" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="orders/[orderId]" />
        <Stack.Screen name="products/new" />
        <Stack.Screen name="products/[productId]" />
        <Stack.Screen name="store/hours" />
        <Stack.Screen name="store/delivery" />
      </Stack>
    </QueryClientProvider>
  );
}

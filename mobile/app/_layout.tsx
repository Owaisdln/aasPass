import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image, Animated } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import {
  useFonts,
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
} from "@expo-google-fonts/nunito-sans";
import { colors } from "../src/theme";
import { logoMark } from "../src/data";
import { useAppStore } from "../src/store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });

  const [splashFinished, setSplashFinished] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(1))[0];
  const scaleAnim = useState(() => new Animated.Value(0.92))[0];
  const textFadeAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    // Bootstrap backend connection & session on app start
    void useAppStore.getState().bootstrap();

    // Start splash screen animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Transition splash away once fonts load
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setSplashFinished(true);
      });
    }, 1100);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, textFadeAnim]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="store/[storeId]" options={{ headerShown: false }} />
          <Stack.Screen name="product/[productId]" options={{ headerShown: false }} />
          <Stack.Screen name="order/[orderId]" options={{ headerShown: false }} />
          <Stack.Screen name="cart" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ headerShown: false }} />
          <Stack.Screen name="sessions" options={{ headerShown: false }} />
          <Stack.Screen name="connection" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack>

        {/* Custom aasPass Splash Screen matching web */}
        {!splashFinished && (
          <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]} pointerEvents="none">
            <Animated.View
              style={[
                styles.splashContent,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Image source={logoMark} style={styles.splashLogo} resizeMode="contain" />
              <Animated.View style={{ opacity: textFadeAnim, alignItems: "center" }}>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandAas}>aas</Text>
                  <Text style={styles.brandPass}>Pass</Text>
                </View>
                <Text style={styles.brandTagline}>Sab Kuch Milega, AasPass</Text>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        )}

        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  splashContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogo: {
    width: 140,
    height: 140,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  brandAas: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.primary,
  },
  brandPass: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.offer,
  },
  brandTagline: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: colors.mutedForeground,
    letterSpacing: 0.3,
  },
});

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { colors, radius, spacing } from "../theme";
import { ScreenHeader } from "../components";
import {
  getConnection,
  isApiConfigured,
  isAuthConfigured,
  resetConnection,
  saveConnection,
} from "../api/config";
import { resetSupabase } from "../api/auth";
import { useAppStore } from "../store";

export function ConnectionScreen() {
  const initial = getConnection();
  const [apiUrl, setApiUrl] = useState(initial.apiUrl);
  const [supabaseUrl, setSupabaseUrl] = useState(initial.supabaseUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initial.supabaseAnonKey);

  const bootstrap = useAppStore((state) => state.bootstrap);
  const sync = useAppStore((state) => state.sync);

  const handleSave = async () => {
    await saveConnection({ apiUrl, supabaseUrl, supabaseAnonKey });
    resetSupabase();
    await bootstrap();
    Toast.show({
      type: "success",
      text1: isApiConfigured()
        ? "Connected — sign in to load your account"
        : "Settings saved",
    });
  };

  const handleClear = async () => {
    const next = await resetConnection();
    setApiUrl(next.apiUrl);
    setSupabaseUrl(next.supabaseUrl);
    setSupabaseAnonKey(next.supabaseAnonKey);
    resetSupabase();
    Toast.show({ type: "success", text1: "Settings cleared" });
  };

  const statusLabel = (status: string) => {
    if (status === "synced") return "Live from server";
    if (status === "syncing") return "Loading…";
    if (status === "error") return "Server unreachable";
    return "This device";
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <ScreenHeader title="Server connection" backTo="/account" />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.description}>
          Enter the address of your running aasPass server and the Supabase project it verifies
          sign-ins against. On a physical phone, use your computer&apos;s Wi-Fi IP instead of localhost.
        </Text>

        <View style={styles.formBox}>
          <Text style={styles.fieldLabel}>Server address</Text>
          <TextInput
            style={styles.textInput}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://10.0.2.2:3000 or http://localhost:3000"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Supabase project URL</Text>
          <TextInput
            style={styles.textInput}
            value={supabaseUrl}
            onChangeText={setSupabaseUrl}
            placeholder="https://xxxx.supabase.co"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Supabase publishable key</Text>
          <TextInput
            style={styles.textInput}
            value={supabaseAnonKey}
            onChangeText={setSupabaseAnonKey}
            placeholder="sb_publishable_… / eyJ…"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
            >
              <Text style={styles.saveBtnText}>Save &amp; connect</Text>
            </Pressable>

            <Pressable
              onPress={handleClear}
              style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
          </View>
        </View>

        {/* Data Source Breakdown */}
        <View style={styles.statusBox}>
          <Text style={styles.statusBoxTitle}>Where the data comes from</Text>
          <View style={styles.statusList}>
            <View style={styles.statusRow}>
              <Text style={styles.statusItemLabel}>Profile</Text>
              <Text style={styles.statusItemValue}>{statusLabel(sync.profile)}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusItemLabel}>Devices</Text>
              <Text style={styles.statusItemValue}>{statusLabel(sync.sessions)}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusItemLabel}>Orders</Text>
              <Text style={styles.statusItemValue}>{statusLabel(sync.orders)}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusItemLabel}>Wishlist</Text>
              <Text style={styles.statusItemValue}>{statusLabel(sync.wishlist)}</Text>
            </View>
          </View>

          <Text style={styles.statusNotice}>
            Sign-in {isAuthConfigured() ? "uses your Supabase project" : "is in demo mode"}.
            Store listings, prices, stock, the cart and saved addresses stay on this device — the
            server does not expose customer-facing endpoints for them yet.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeHeader: {
    backgroundColor: colors.card,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
  formBox: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  saveBtn: {
    flex: 2,
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  clearBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  statusBox: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  statusBoxTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  statusList: {
    gap: spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusItemLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  statusItemValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  statusNotice: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
});

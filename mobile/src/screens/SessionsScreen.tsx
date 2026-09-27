import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from "react-native";
import { Laptop, LogOut, Smartphone } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { colors, radius, spacing } from "../theme";
import { ScreenHeader } from "../components";
import { useAppStore } from "../store";

export function SessionsScreen() {
  const sessions = useAppStore((state) => state.sessions);
  const revokeSession = useAppStore((state) => state.revokeSession);
  const revokeOtherSessions = useAppStore((state) => state.revokeOtherSessions);
  const others = sessions.filter((session) => !session.current);

  const handleRevokeOther = () => {
    Alert.alert(
      `Sign out ${others.length} other device${others.length === 1 ? "" : "s"}?`,
      "You stay signed in on this device. Other devices will need to sign in again.",
      [
        { text: "Keep them", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            const count = revokeOtherSessions();
            if (count) {
              Toast.show({
                type: "success",
                text1: `${count} device${count === 1 ? "" : "s"} signed out`,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <ScreenHeader title="Active devices" backTo="/account" />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>
          These devices are signed in to your aasPass account. Sign out any device you don’t
          recognise.
        </Text>

        <View style={styles.devicesCard}>
          {sessions.map((session) => {
            const isComputer =
              session.platform.toLowerCase().includes("macos") ||
              session.platform.toLowerCase().includes("windows");
            const Icon = isComputer ? Laptop : Smartphone;

            return (
              <View key={session.id} style={styles.deviceRow}>
                <View
                  style={[
                    styles.iconBox,
                    session.current ? styles.iconBoxCurrent : styles.iconBoxOther,
                  ]}
                >
                  <Icon size={20} color={colors.primary} />
                </View>

                <View style={styles.deviceInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.deviceName}>{session.device}</Text>
                    {session.current && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>This device</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.deviceMeta} numberOfLines={1}>
                    {session.platform} · {session.location}
                  </Text>
                  <Text style={styles.deviceTime}>{session.lastActive}</Text>
                </View>

                {!session.current && (
                  <Pressable
                    onPress={() => {
                      if (revokeSession(session.id)) {
                        Toast.show({
                          type: "success",
                          text1: `${session.device} signed out`,
                        });
                      }
                    }}
                    style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.signOutBtnText}>Sign out</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={handleRevokeOther}
          disabled={!others.length}
          style={({ pressed }) => [
            styles.signOutAllBtn,
            !others.length && styles.disabledBtn,
            pressed && styles.pressed,
          ]}
        >
          <LogOut size={16} color={colors.destructive} />
          <Text style={styles.signOutAllText}>Sign out all other devices</Text>
        </Pressable>

        <Text style={styles.footerNote}>
          Devices shown here are from this prototype session. Live device history and remote sign-out
          connect to the account service later.
        </Text>
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
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  devicesCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxCurrent: {
    backgroundColor: colors.freshSoft,
  },
  iconBoxOther: {
    backgroundColor: colors.muted,
  },
  deviceInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  currentBadge: {
    backgroundColor: colors.freshSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.freshText,
  },
  deviceMeta: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  deviceTime: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  signOutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  signOutBtnText: {
    color: colors.destructive,
    fontSize: 13,
    fontWeight: "700",
  },
  signOutAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.destructive,
    backgroundColor: colors.card,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  signOutAllText: {
    color: colors.destructive,
    fontSize: 14,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.4,
  },
  footerNote: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import {
  Bell,
  Heart,
  HelpCircle,
  LogOut,
  MonitorSmartphone,
  Package,
  Server,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { colors, radius, shadows, spacing } from "../theme";
import {
  AccountRow,
  FloatingCartBar,
  LocationPicker,
  PaymentMethodsRow,
} from "../components";
import { useAppStore } from "../store";

export function AccountScreen() {
  const router = useRouter();
  const firstName = useAppStore((state) => state.firstName);
  const lastName = useAppStore((state) => state.lastName);
  const updateName = useAppStore((state) => state.updateName);
  const signOut = useAppStore((state) => state.signOut);
  const orders = useAppStore((state) => state.orders);
  const wishlist = useAppStore((state) => state.wishlist);
  const sessions = useAppStore((state) => state.sessions);
  const email = useAppStore((state) => state.email);
  const phone = useAppStore((state) => state.phone);
  const sync = useAppStore((state) => state.sync);

  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);

  const handleSaveName = () => {
    updateName(first, last);
    setEditing(false);
    Toast.show({ type: "success", text1: "Profile updated" });
  };

  const handleLogout = () => {
    signOut();
    router.replace("/sign-in");
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Green Hero */}
        <View style={styles.userHero}>
          <SafeAreaView edges={["top"]} style={styles.userHeroSafe}>
            <View style={styles.userRow}>
              <View style={styles.avatarCircle}>
                <UserRound size={28} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.userName}>
                  {firstName} {lastName}
                </Text>
                <Text style={styles.userRole}>aasPass customer</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* First Settings Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.settingsCard}>
            <AccountRow
              icon={Package}
              label="My orders"
              detail={
                orders.length
                  ? `${orders.length} recent order${orders.length === 1 ? "" : "s"}`
                  : "Track current and past orders"
              }
              to="/orders"
            />
            <LocationPicker variant="account" />
            <AccountRow
              icon={Heart}
              label="Wishlist"
              detail={`${wishlist.length} saved product${wishlist.length === 1 ? "" : "s"}`}
              to="/wishlist"
            />
            <PaymentMethodsRow />
            <AccountRow
              icon={Bell}
              label="Notifications"
              detail="Order and offer alerts"
              onClick={() =>
                Toast.show({
                  type: "info",
                  text1: "Notification preferences will connect with native notifications.",
                })
              }
            />
            <AccountRow
              icon={ShieldCheck}
              label="Privacy & data"
              detail="Customer data settings"
              onClick={() =>
                Toast.show({
                  type: "info",
                  text1: "Privacy controls will connect with account services later.",
                })
              }
            />
            <AccountRow
              icon={HelpCircle}
              label="Help & support"
              detail="Contact and order help"
              onClick={() =>
                Toast.show({
                  type: "info",
                  text1: "Support is planned for the full release.",
                })
              }
            />
            <AccountRow
              icon={Star}
              label="Rate the app"
              detail="Share feedback on aasPass"
              onClick={() =>
                Toast.show({
                  type: "info",
                  text1: "Ratings will be available on the app store.",
                })
              }
            />
          </View>
        </View>

        {/* Second Settings Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.settingsCard}>
            <AccountRow
              icon={UserRound}
              label="Profile details"
              detail="Name and verified contact"
              onClick={() => setEditing(!editing)}
            />

            {editing && (
              <View style={styles.profileEditBox}>
                <View style={styles.nameRow}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    value={first}
                    onChangeText={setFirst}
                    placeholder="First name"
                    placeholderTextColor={colors.mutedForeground}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    value={last}
                    onChangeText={setLast}
                    placeholder="Last name"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={email}
                  editable={false}
                />
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={phone}
                  editable={false}
                />
                <Pressable
                  onPress={handleSaveName}
                  style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.saveBtnText}>Save name</Text>
                </Pressable>
              </View>
            )}

            <AccountRow
              icon={MonitorSmartphone}
              label="Active devices"
              detail={`${sessions.length} device${sessions.length === 1 ? "" : "s"} signed in`}
              to="/sessions"
            />
            <AccountRow
              icon={Server}
              label="Server connection"
              detail={
                sync.profile === "synced"
                  ? "Connected to your aasPass server"
                  : "Running on sample data"
              }
              to="/connection"
            />
            <AccountRow
              icon={LogOut}
              label="Log out"
              detail="Sign out of this account"
              onClick={handleLogout}
            />
          </View>
        </View>

        <Text style={styles.prototypeFooter}>aasPass customer mobile</Text>
      </ScrollView>

      <FloatingCartBar bottomOffset={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  userHero: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  userHeroSafe: {
    paddingTop: spacing.xs,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryForeground,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primaryForeground,
  },
  userRole: {
    fontSize: 13,
    color: colors.primaryForeground,
    opacity: 0.8,
    marginTop: 2,
  },
  cardWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  settingsCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  profileEditBox: {
    backgroundColor: colors.muted,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  nameRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  disabledInput: {
    backgroundColor: colors.muted,
    color: colors.mutedForeground,
  },
  saveBtn: {
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  saveBtnText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  prototypeFooter: {
    textAlign: "center",
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
});

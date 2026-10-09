import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { colors, radius, spacing } from "../theme";
import { logoMark } from "../data";
import { isAuthConfigured } from "../api/config";
import {
  listDemoUsers,
  sendPhoneOtp,
  signInDemoUser,
  signInWithPassword,
  verifyPhoneOtp,
  type DemoUser,
} from "../api/auth";
import { useAppStore } from "../store";

export function SignInScreen() {
  const router = useRouter();
  const signIn = useAppStore((state) => state.signIn);
  const live = isAuthConfigured();

  // ── Phone OTP state ────────────────────────────────────────────────────────
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // ── Test / email-password state ────────────────────────────────────────────
  const [testMode, setTestMode] = useState(true);
  const [testUsers, setTestUsers] = useState<DemoUser[]>([]);
  const [demoUsersError, setDemoUsersError] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testPassword, setTestPassword] = useState("");

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    listDemoUsers().then((users) => {
      if (!mounted) return;
      setTestUsers(users);
      setTestEmail((current) => current || users[0]?.email || "");
    }).catch((error: unknown) => {
      if (mounted) {
        setDemoUsersError(error instanceof Error ? error.message : "Could not load demo accounts.");
      }
    });
    return () => { mounted = false; };
  }, []);

  const finish = async (token?: string, isDemoSignIn = false) => {
    if (live && !token && !isDemoSignIn) {
      throw new Error("Authentication did not return an active session. Please try again.");
    }
    await signIn(token);
    router.replace("/");
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setBusy(false);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSendOtp = () =>
    run(async () => {
      if (!live) throw new Error("Choose a database demo account below to sign in.");
      await sendPhoneOtp(`+91${mobile}`);
      setOtpSent(true);
      Toast.show({ type: "success", text1: "OTP sent via SMS" });
    });

  const handleVerifyOtp = () =>
    run(async () => {
      if (!live) throw new Error("Authentication is not configured.");
      const session = await verifyPhoneOtp(`+91${mobile}`, otp);
      await finish(session?.access_token);
    });

  const handleBack = () => {
    setOtpSent(false);
    setOtp("");
  };

  const handleTestSignIn = () =>
    run(async () => {
      const email = testEmail.trim().toLowerCase();
      if (!email) throw new Error("Choose a demo account or enter your account email.");
      setTestEmail(email);
      if (testUsers.some((user) => user.email.toLowerCase() === email)) {
        const session = await signInDemoUser(email);
        return finish(session.access_token, true);
      }

      if (!live) throw new Error("This email is not a database demo account.");
      if (!testPassword) throw new Error("Enter your account password.");
      const session = await signInWithPassword(email, testPassword);
      await finish(session?.access_token);
    });

  const fillTestUser = (email: string) => {
    setTestEmail(email);
    setTestPassword("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Logo ── */}
          <View style={styles.logoWrap}>
            <Image source={logoMark} style={styles.logo} resizeMode="contain" />
            <View style={styles.brandRow}>
              <Text style={styles.brandAas}>aas</Text>
              <Text style={styles.brandPass}>Pass</Text>
            </View>
          </View>

          {/* ── Hero text ── */}
          <View style={styles.heroWrap}>
            <Text style={styles.eyebrow}>Your neighbourhood, closer</Text>
            <Text style={styles.heading}>
              Essentials from local stores,{"\n"}delivered fast.
            </Text>
            <Text style={styles.subheading}>
              {live
                ? "Sign in with your account, or choose a database-backed demo account below."
                : "Choose a database-backed demo account below to get started."}
            </Text>
          </View>

          {/* ── Phone OTP form ── */}
          <View style={styles.form}>
            {!otpSent ? (
              <>
                <Text style={styles.label}>Mobile number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.countryBox}>
                    <Text style={styles.countryText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    keyboardType="numeric"
                    maxLength={10}
                    placeholder="10-digit number"
                    placeholderTextColor={colors.mutedForeground}
                    value={mobile}
                    onChangeText={(v) => setMobile(v.replace(/\D/g, ""))}
                    accessibilityLabel="Mobile number input"
                  />
                </View>

                <Pressable
                  onPress={handleSendOtp}
                  disabled={busy || (live && mobile.length !== 10)}
                  style={({ pressed }) => [
                    styles.btn,
                    (busy || (live && mobile.length !== 10)) && styles.btnDisabled,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Send OTP button"
                >
                  <Text style={styles.btnText}>
                    {busy ? "Sending…" : live ? "Send OTP" : "Continue"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.otpHint}>
                  Enter the 6-digit code sent to{" "}
                  <Text style={styles.otpHintBold}>+91 {mobile}</Text>
                </Text>

                <TextInput
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  placeholderTextColor={colors.mutedForeground}
                  value={otp}
                  onChangeText={(v) => setOtp(v.replace(/\D/g, ""))}
                  autoFocus
                  accessibilityLabel="OTP input"
                />

                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={busy || (live && otp.length < 4)}
                  style={({ pressed }) => [
                    styles.btn,
                    (busy || (live && otp.length < 4)) && styles.btnDisabled,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Verify OTP button"
                >
                  <Text style={styles.btnText}>
                    {busy ? "Verifying…" : "Verify & continue"}
                  </Text>
                </Pressable>

                <Pressable onPress={handleBack} style={styles.backBtn}>
                  <Text style={styles.backText}>← Change number</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Testing Mode Toggle ── */}
          <Pressable
            onPress={() => setTestMode((v) => !v)}
            style={styles.testToggleBtn}
            accessibilityRole="button"
            accessibilityLabel="Toggle testing mode"
          >
            <View style={styles.testToggleInner}>
              <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>DEV</Text>
              </View>
              <Text style={styles.testToggleText}>
                {testMode ? "Hide test accounts" : "Sign in with test account"}
              </Text>
              <Text style={styles.testToggleChevron}>{testMode ? "▲" : "▼"}</Text>
            </View>
          </Pressable>

          {testMode && (
            <View style={styles.testPanel}>
              <Text style={styles.testPanelTitle}>Database demo accounts</Text>
              {demoUsersError ? <Text style={styles.subheading}>{demoUsersError}</Text> : null}

              {/* Demo accounts are loaded from active database users by the API. */}
              <View style={styles.testUserGrid}>
                {testUsers.map((user) => (
                  <Pressable
                    key={user.id}
                    onPress={() => fillTestUser(user.email)}
                    style={({ pressed }) => [
                      styles.testUserChip,
                      testEmail === user.email && styles.testUserChipActive,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${user.firstName} demo account`}
                  >
                    <Text
                      style={[
                        styles.testUserChipText,
                        testEmail === user.email && styles.testUserChipTextActive,
                      ]}
                    >
                      {`${user.firstName} ${user.lastName ?? ""}`.trim()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.credTable}>
                <View style={styles.credRow}>
                  <Text style={styles.credHeader}>Database user</Text>
                  <Text style={styles.credHeader}>Email</Text>
                </View>
                {testUsers.map((user) => (
                  <Pressable
                    key={user.id}
                    onPress={() => fillTestUser(user.email)}
                    style={({ pressed }) => [
                      styles.credRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.credName}>{`${user.firstName} ${user.lastName ?? ""}`.trim()}</Text>
                    <Text style={styles.credEmail}>{user.email}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Email field */}
              <Text style={[styles.label, { marginTop: spacing.md }]}>Email</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="email@aaspass.test"
                placeholderTextColor={colors.mutedForeground}
                value={testEmail}
                onChangeText={setTestEmail}
                accessibilityLabel="Test email input"
              />

              {/* Password field */}
              {testUsers.some((user) => user.email.toLowerCase() === testEmail.trim().toLowerCase())
                ? <Text style={styles.subheading}>Demo sign-in uses this database account; no password is required.</Text>
                : (
                  <>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.textInput}
                      secureTextEntry
                      placeholder="Enter your account password"
                      placeholderTextColor={colors.mutedForeground}
                      value={testPassword}
                      onChangeText={setTestPassword}
                      accessibilityLabel="Test password input"
                    />
                  </>
                )}

              <Pressable
                onPress={handleTestSignIn}
                disabled={busy || !testEmail || (
                  !testUsers.some((user) => user.email.toLowerCase() === testEmail.trim().toLowerCase())
                  && (!live || testPassword.length < 6)
                )}
                style={({ pressed }) => [
                  styles.testSignInBtn,
                  (busy || !testEmail || (
                    !testUsers.some((user) => user.email.toLowerCase() === testEmail.trim().toLowerCase())
                    && (!live || testPassword.length < 6)
                  )) && styles.btnDisabled,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Test sign in button"
              >
                <Text style={styles.testSignInBtnText}>
                  {busy ? "Signing in…" : "Sign in"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Connection link */}
          <Pressable
            onPress={() => router.push("/connection")}
            style={styles.connectionLink}
          >
            <Text style={styles.connectionLinkText}>Server connection settings</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:     { flex: 1, backgroundColor: colors.card },
  keyboardView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing["3xl"],
  },

  // Logo
  logoWrap:  { alignItems: "center", marginVertical: spacing.lg },
  logo:      { width: 80, height: 80 },
  brandRow:  { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  brandAas:  { fontSize: 26, fontWeight: "800", color: colors.primary },
  brandPass: { fontSize: 26, fontWeight: "800", color: colors.offer },

  // Hero
  heroWrap: { marginTop: spacing.md },
  eyebrow: {
    fontSize: 12, fontWeight: "800", textTransform: "uppercase",
    color: colors.primary, letterSpacing: 0.5,
  },
  heading: {
    fontSize: 26, fontWeight: "800", color: colors.foreground,
    lineHeight: 32, marginTop: 6,
  },
  subheading: {
    fontSize: 14, color: colors.mutedForeground,
    lineHeight: 20, marginTop: spacing.sm,
  },

  // Phone form
  form:  { marginTop: spacing["2xl"], gap: spacing.sm },
  label: { fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 2 },
  phoneRow:   { flexDirection: "row", height: 52 },
  countryBox: {
    height: 52, paddingHorizontal: spacing.md,
    borderWidth: 1, borderRightWidth: 0, borderColor: colors.input,
    borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md,
    backgroundColor: colors.muted, alignItems: "center", justifyContent: "center",
  },
  countryText: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  phoneInput: {
    flex: 1, height: 52,
    borderWidth: 1, borderColor: colors.input,
    borderTopRightRadius: radius.md, borderBottomRightRadius: radius.md,
    paddingHorizontal: spacing.md, fontSize: 16,
    color: colors.foreground, backgroundColor: colors.card,
  },
  textInput: {
    height: 48, borderWidth: 1, borderColor: colors.input,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    fontSize: 14, color: colors.foreground, backgroundColor: colors.card,
  },
  otpHint:     { fontSize: 14, color: colors.mutedForeground, lineHeight: 20, marginBottom: spacing.xs },
  otpHintBold: { fontWeight: "700", color: colors.foreground },
  otpInput: {
    height: 60, borderWidth: 2, borderColor: colors.primary,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    fontSize: 28, fontWeight: "700", color: colors.foreground,
    backgroundColor: colors.card, textAlign: "center", letterSpacing: 14,
  },
  btn: {
    height: 52, backgroundColor: colors.primary,
    borderRadius: radius.full, alignItems: "center",
    justifyContent: "center", marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.45 },
  btnText:     { color: colors.primaryForeground, fontSize: 15, fontWeight: "700" },
  backBtn:     { alignItems: "center", paddingVertical: spacing.sm, marginTop: spacing.xs },
  backText:    { fontSize: 13, fontWeight: "600", color: colors.primary },

  // Divider
  dividerRow:  { flexDirection: "row", alignItems: "center", marginTop: spacing.xl, gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.input },
  dividerLabel:{ fontSize: 12, color: colors.mutedForeground, fontWeight: "600" },

  // Test mode toggle
  testToggleBtn: { marginTop: spacing.lg },
  testToggleInner: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: colors.input, borderStyle: "dashed",
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 10, gap: spacing.sm,
  },
  testBadge: {
    backgroundColor: "#f59e0b", borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  testBadgeText:    { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  testToggleText:   { flex: 1, fontSize: 13, fontWeight: "600", color: colors.foreground },
  testToggleChevron:{ fontSize: 10, color: colors.mutedForeground },

  // Test panel
  testPanel: {
    marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.input,
    borderRadius: radius.lg, padding: spacing.lg,
    backgroundColor: colors.muted, gap: spacing.sm,
  },
  testPanelTitle: {
    fontSize: 13, fontWeight: "700",
    color: colors.foreground, marginBottom: spacing.xs,
  },
  testUserGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  testUserChip: {
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: radius.full, borderWidth: 1.5,
    borderColor: colors.input, backgroundColor: colors.card,
  },
  testUserChipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  testUserChipText:       { fontSize: 13, fontWeight: "600", color: colors.foreground },
  testUserChipTextActive: { color: colors.primaryForeground },

  // Credentials table
  credTable: {
    borderWidth: 1, borderColor: colors.input,
    borderRadius: radius.md, overflow: "hidden",
    marginVertical: spacing.sm,
  },
  credRow: {
    flexDirection: "row", paddingHorizontal: spacing.sm,
    paddingVertical: 7, borderBottomWidth: 1,
    borderBottomColor: colors.input, gap: 4,
  },
  credHeader: { flex: 1, fontSize: 10, fontWeight: "800", color: colors.mutedForeground, textTransform: "uppercase" },
  credName:   { flex: 1, fontSize: 11, fontWeight: "700", color: colors.foreground },
  credEmail:  { flex: 2, fontSize: 10, color: colors.foreground },
  credPass:   { flex: 1.5, fontSize: 10, fontFamily: "monospace", color: colors.foreground },

  // Test sign-in button
  testSignInBtn: {
    height: 48, backgroundColor: "#f59e0b",
    borderRadius: radius.full, alignItems: "center",
    justifyContent: "center", marginTop: spacing.sm,
  },
  testSignInBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Connection link
  connectionLink: { alignItems: "center", marginTop: spacing["2xl"], paddingVertical: spacing.sm },
  connectionLinkText: {
    fontSize: 12, fontWeight: "700",
    color: colors.mutedForeground, textDecorationLine: "underline",
  },
  pressed: { opacity: 0.8 },
});

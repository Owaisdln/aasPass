import { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { Link, Redirect, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { demoLogin, listDemoUsers, signInWithPassword } from "../src/features/vendor/api/auth";
import { isApiConfigured, isAuthConfigured } from "../src/features/vendor/api/config";
import { setApiAccessToken } from "../src/features/vendor/api/client";
import { useSession } from "../src/features/vendor/session";
import { ActionButton, Card, ErrorNote, Field, Loading, palette, Screen } from "../src/native/ui";
import aasPassMark from "../src/assets/aaspass-mark.png";

export default function SignInScreen() {
  const { session, hydrated, signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiReady = isApiConfigured();
  const demoUsers = useQuery({
    queryKey: ["demo-users"],
    queryFn: listDemoUsers,
    enabled: apiReady,
    retry: false,
  });

  useEffect(() => {
    if (hydrated && session) router.replace("/(tabs)/orders");
  }, [hydrated, session]);

  if (!hydrated) return <Loading />;
  if (session) return <Redirect href="/(tabs)/orders" />;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.replace("/(tabs)/orders");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ padding: 24, paddingTop: 54 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image source={aasPassMark} style={{ width: 54, height: 54 }} resizeMode="contain" />
            <View>
              <Text style={{ color: palette.primary, fontSize: 25, fontWeight: "900" }}>
                aasPass
              </Text>
              <Text
                style={{
                  color: palette.muted,
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1.2,
                }}
              >
                PARTNER
              </Text>
            </View>
          </View>
          <Text style={{ marginTop: 32, color: palette.ink, fontSize: 26, fontWeight: "900" }}>
            Welcome back
          </Text>
          <Text style={{ marginTop: 6, marginBottom: 22, color: palette.muted, fontSize: 14 }}>
            Sign in to take orders and manage your store.
          </Text>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@yourstore.in"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
          />
          {isAuthConfigured() ? (
            <ActionButton
              title={busy ? "Signing in…" : "Sign in"}
              disabled={busy}
              onPress={() => {
                if (!email.includes("@") || password.length < 6) {
                  setError("Enter a valid email and a password with at least 6 characters.");
                  return;
                }
                void run(async () => {
                  const account = await signInWithPassword(email.trim(), password);
                  setApiAccessToken(account.token);
                  signIn(
                    {
                      mode: "live",
                      email: account.email,
                      name: account.email.split("@")[0] ?? account.email,
                    },
                    account.token,
                  );
                });
              }}
            />
          ) : (
            <Text style={{ marginBottom: 12, color: palette.muted, fontSize: 12 }}>
              Email sign-in needs Supabase settings on the Connection screen.
            </Text>
          )}

          {apiReady && (
            <View style={{ marginTop: 24 }}>
              <Text
                style={{
                  marginBottom: 10,
                  color: palette.muted,
                  fontSize: 11,
                  fontWeight: "900",
                  letterSpacing: 0.8,
                }}
              >
                TEST ACCOUNTS ON YOUR SERVER
              </Text>
              {demoUsers.isLoading ? <Loading /> : null}
              {demoUsers.error ? <ErrorNote message={demoUsers.error.message} /> : null}
              {(demoUsers.data ?? []).map((user) => (
                <Pressable
                  key={user.id}
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      const result = await demoLogin(user.email);
                      setApiAccessToken(result.access_token);
                      signIn(
                        {
                          mode: "live",
                          email: user.email,
                          name:
                            [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
                        },
                        result.access_token,
                      );
                    })
                  }
                  style={{ marginBottom: 8 }}
                >
                  <Card style={{ padding: 12 }}>
                    <Text style={{ color: palette.ink, fontSize: 14, fontWeight: "800" }}>
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Demo account"}
                    </Text>
                    <Text style={{ marginTop: 2, color: palette.muted, fontSize: 12 }}>
                      {user.email}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          <View style={{ alignItems: "center", marginVertical: 18 }}>
            <Text style={{ color: palette.muted, fontSize: 12 }}>OR USE A LOCAL WALKTHROUGH</Text>
          </View>
          <ActionButton
            title="Explore a sample store"
            secondary
            disabled={busy}
            onPress={() => {
              signIn({ mode: "demo", email: "owner@sharmafresh.in", name: "Rakesh Sharma" });
              router.replace("/(tabs)/orders");
            }}
          />
          {error ? (
            <View style={{ marginTop: 12 }}>
              <ErrorNote message={error} />
            </View>
          ) : null}
          <Link
            href="/connect"
            style={{
              alignSelf: "center",
              marginTop: 24,
              color: palette.muted,
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            Connection settings
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

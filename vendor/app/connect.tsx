import { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  getConnection,
  resetConnection,
  saveConnection,
  type Connection,
} from "../src/features/vendor/api/config";
import { ActionButton, Field, Screen, Section, TopBar } from "../src/native/ui";

export default function ConnectionScreen() {
  const [form, setForm] = useState<Connection>({
    apiUrl: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => setForm(getConnection()), []);

  const save = async () => {
    setBusy(true);
    try {
      setForm(await saveConnection(form));
      Alert.alert("Saved", "Connection settings have been saved.");
    } catch (error) {
      Alert.alert(
        "Could not save settings",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      setForm(await resetConnection());
      Alert.alert("Reset", "Connection settings returned to app defaults.");
    } catch (error) {
      Alert.alert(
        "Could not reset settings",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Connection" back />
      <Section>
        <Field
          label="Server address"
          placeholder="http://localhost:3000"
          autoCapitalize="none"
          keyboardType="url"
          value={form.apiUrl}
          onChangeText={(apiUrl) => setForm({ ...form, apiUrl })}
        />
      </Section>
      <Section title="Email sign-in">
        <Field
          label="Supabase project address"
          placeholder="https://xyz.supabase.co"
          autoCapitalize="none"
          keyboardType="url"
          value={form.supabaseUrl}
          onChangeText={(supabaseUrl) => setForm({ ...form, supabaseUrl })}
        />
        <Field
          label="Public sign-in key"
          autoCapitalize="none"
          value={form.supabaseAnonKey}
          onChangeText={(supabaseAnonKey) => setForm({ ...form, supabaseAnonKey })}
        />
      </Section>
      <Section>
        <ActionButton
          title={busy ? "Saving…" : "Save settings"}
          disabled={busy}
          onPress={() => void save()}
        />
        <ActionButton
          title="Reset to defaults"
          secondary
          disabled={busy}
          onPress={() => void reset()}
        />
      </Section>
    </Screen>
  );
}

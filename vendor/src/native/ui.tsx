import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const palette = {
  primary: "#2F855A",
  primaryDark: "#276749",
  ink: "#17211B",
  muted: "#68766D",
  border: "#E1E8E3",
  surface: "#FFFFFF",
  background: "#F5F8F5",
  soft: "#E8F4EC",
  warning: "#B45309",
  warningSoft: "#FFF4D6",
  danger: "#B42318",
  dangerSoft: "#FEECEB",
};

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  if (!scroll) return <View style={styles.screen}>{children}</View>;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function TopBar({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string | undefined;
  back?: boolean;
  right?: ReactNode;
}) {
  return (
    <View style={styles.topBar}>
      {back ? (
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={palette.ink} />
        </Pressable>
      ) : null}
      <View style={styles.topText}>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.topSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={palette.muted}
        style={[styles.input, props.multiline && styles.multiline, style]}
      />
    </View>
  );
}

export function ActionButton({
  title,
  onPress,
  secondary = false,
  disabled = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        danger && styles.dangerButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.secondaryButtonText,
          danger && styles.dangerButtonText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Tag({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: "neutral" | "green" | "yellow" | "red";
}) {
  return (
    <Text
      style={[
        styles.tag,
        tone === "green" && styles.tagGreen,
        tone === "yellow" && styles.tagYellow,
        tone === "red" && styles.tagRed,
      ]}
    >
      {text}
    </Text>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={palette.primary} size="large" />
    </View>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <Card style={styles.errorCard}>
      <Text style={styles.errorText}>{message}</Text>
    </Card>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{body}</Text>
    </Card>
  );
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return hours < 24
    ? `${hours} hr ago`
    : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function useVendorMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  successMessage?: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vendor"] });
      if (successMessage) Alert.alert("Saved", successMessage);
    },
    onError: (error: Error) => Alert.alert("Could not complete action", error.message),
  });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { paddingBottom: 28 },
  topBar: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backButton: { marginRight: 6, paddingVertical: 6, paddingRight: 4 },
  topText: { flex: 1 },
  topTitle: { color: palette.ink, fontSize: 18, fontWeight: "800" },
  topSubtitle: { color: palette.muted, fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 9,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  field: { gap: 6, marginBottom: 12 },
  label: { color: palette.ink, fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    backgroundColor: palette.surface,
    color: palette.ink,
    fontSize: 15,
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  button: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: palette.primary,
  },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  secondaryButtonText: { color: palette.ink },
  dangerButton: { backgroundColor: palette.dangerSoft },
  dangerButtonText: { color: palette.danger },
  disabledButton: { opacity: 0.55 },
  pressedButton: { opacity: 0.82 },
  tag: {
    overflow: "hidden",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    color: palette.muted,
    backgroundColor: "#EEF1EF",
    fontSize: 11,
    fontWeight: "800",
  },
  tagGreen: { color: palette.primaryDark, backgroundColor: palette.soft },
  tagYellow: { color: palette.warning, backgroundColor: palette.warningSoft },
  tagRed: { color: palette.danger, backgroundColor: palette.dangerSoft },
  center: { flex: 1, minHeight: 160, alignItems: "center", justifyContent: "center" },
  errorCard: { margin: 16, backgroundColor: palette.dangerSoft, borderColor: "#F5C2BE" },
  errorText: { color: palette.danger, fontSize: 13, lineHeight: 19 },
  empty: { alignItems: "center", marginTop: 16 },
  emptyTitle: { marginBottom: 4, color: palette.ink, fontWeight: "800", fontSize: 15 },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 19 },
});

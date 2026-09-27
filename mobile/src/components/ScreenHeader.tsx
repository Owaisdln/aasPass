import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors, spacing } from "../theme";

export function ScreenHeader({
  title,
  backTo,
  action,
  showBack = true,
}: {
  title: string;
  backTo?: string;
  action?: React.ReactNode;
  showBack?: boolean;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backTo) {
      router.replace(backTo as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.foreground} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightContainer}>{action ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
  },
  leftContainer: {
    width: 40,
    alignItems: "flex-start",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
  },
  rightContainer: {
    width: 40,
    alignItems: "flex-end",
  },
  pressed: {
    opacity: 0.7,
  },
});

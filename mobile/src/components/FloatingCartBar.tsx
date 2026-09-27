import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { ShoppingBag } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors, radius, shadows, spacing } from "../theme";
import { useAppStore } from "../store";

export function FloatingCartBar({ bottomOffset = 16 }: { bottomOffset?: number }) {
  const router = useRouter();
  const cart = useAppStore((state) => state.cart);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  if (cartCount === 0) return null;

  return (
    <View style={[styles.container, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Pressable
        onPress={() => router.push("/cart")}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`View cart, ${cartCount} items`}
      >
        <View style={styles.left}>
          <ShoppingBag size={18} color={colors.primaryForeground} />
          <Text style={styles.countText}>
            {cartCount} {cartCount === 1 ? "item" : "items"}
          </Text>
        </View>
        <Text style={styles.viewCartText}>View cart →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.lg,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  countText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryForeground,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primaryForeground,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});

import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { RotateCcw } from "lucide-react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { colors, radius, shadows, spacing } from "../theme";
import { getStore } from "../data";
import { formatMoney } from "../model";
import { useAppStore } from "../store";

export function RepeatOrderCard({ orderId }: { orderId: string }) {
  const router = useRouter();
  const order = useAppStore((state) => state.orders.find((item) => item.id === orderId));
  const repeatOrder = useAppStore((state) => state.repeatOrder);

  if (!order) return null;
  const store = getStore(order.storeId);

  const handleRepeat = () => {
    const result = repeatOrder(order.id);
    if (result === "added") {
      Toast.show({
        type: "success",
        text1: "Items added to your cart",
      });
      router.push("/cart");
    } else {
      Toast.show({
        type: "error",
        text1: "These items are out of stock right now",
      });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <RotateCcw size={20} color={colors.freshText} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Buy it again</Text>
        <Text style={styles.subtext} numberOfLines={1}>
          {store?.name} · {order.items.length} items · {formatMoney(order.total)}
        </Text>
      </View>
      <Pressable
        onPress={handleRepeat}
        style={({ pressed }) => [styles.repeatBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Repeat order"
      >
        <Text style={styles.repeatBtnText}>Repeat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.md,
    ...shadows.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.freshSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  subtext: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  repeatBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  repeatBtnText: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});

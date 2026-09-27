import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PiggyBank } from "lucide-react-native";
import { colors, radius, spacing } from "../theme";
import { formatMoney } from "../model";
import { useAppStore } from "../store";
import { summariseCart } from "../totals";

type Fulfilment = "delivery" | "pickup";

const useCartSummary = (fulfilment: Fulfilment) => {
  const cart = useAppStore((state) => state.cart);
  const storeId = useAppStore((state) => state.cartStoreId);
  return summariseCart(cart, storeId, fulfilment);
};

export function CartTotals({ fulfilment = "delivery" }: { fulfilment?: Fulfilment }) {
  const summary = useCartSummary(fulfilment);

  return (
    <View style={styles.totalsContainer}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Item total</Text>
        <Text style={styles.rowValue}>{formatMoney(summary.subtotal)}</Text>
      </View>

      {summary.savings > 0 && (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Savings on MRP</Text>
          <Text style={styles.savingsValue}>−{formatMoney(summary.savings)}</Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Delivery</Text>
        <Text style={[styles.rowValue, !summary.deliveryFee && styles.freeDeliveryText]}>
          {summary.deliveryFee ? formatMoney(summary.deliveryFee) : "FREE"}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={[styles.row, styles.toPayRow]}>
        <Text style={styles.toPayLabel}>To pay</Text>
        <Text style={styles.toPayValue}>{formatMoney(summary.total)}</Text>
      </View>

      <Text style={styles.disclaimerText}>
        Final totals are confirmed by the store when the order is placed.
      </Text>
    </View>
  );
}

export function CartSavings({ fulfilment = "delivery" }: { fulfilment?: Fulfilment }) {
  const summary = useCartSummary(fulfilment);
  const progress = Math.min(
    100,
    Math.round((summary.subtotal / (summary.freeDeliveryAbove || 1)) * 100)
  );
  const freeNow = summary.deliveryFee === 0;

  return (
    <View style={styles.savingsCard}>
      <View style={styles.savingsHeader}>
        <PiggyBank size={18} color={colors.freshText} />
        <Text style={styles.savingsTitle}>
          {summary.savings > 0
            ? `You save ${formatMoney(summary.savings)} on this order`
            : "Everyday low prices"}
        </Text>
      </View>

      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${freeNow ? 100 : progress}%` },
          ]}
        />
      </View>

      <Text style={styles.progressNote}>
        {freeNow
          ? fulfilment === "pickup"
            ? "Pickup orders have no delivery fee."
            : "Free delivery unlocked on this order."
          : `Add ${formatMoney(summary.freeDeliveryGap)} more for free delivery.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  totalsContainer: {
    gap: spacing.sm + 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  savingsValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  freeDeliveryText: {
    color: colors.primary,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginVertical: 4,
  },
  toPayRow: {
    marginTop: 2,
  },
  toPayLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },
  toPayValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  // CartSavings
  savingsCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.freshSoft,
    padding: spacing.md,
  },
  savingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  savingsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.freshText,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  progressNote: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
  },
});

import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "../theme";
import { getStockStatus, type Product } from "../model";

export function StockLabel({ product, style }: { product: Product; style?: ViewStyle }) {
  const stock = getStockStatus(product);
  if (!stock.low && stock.available) return null;

  return (
    <View
      style={[
        styles.pill,
        stock.available ? styles.availablePill : styles.outOfStockPill,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          stock.available ? styles.availableText : styles.outOfStockText,
        ]}
      >
        {stock.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  availablePill: {
    backgroundColor: colors.offerSoft,
  },
  outOfStockPill: {
    backgroundColor: colors.muted,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
  },
  availableText: {
    color: colors.offerForeground,
  },
  outOfStockText: {
    color: colors.mutedForeground,
  },
});

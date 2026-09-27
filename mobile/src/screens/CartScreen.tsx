import React from "react";
import { StyleSheet, Text, View, ScrollView, Image, Pressable } from "react-native";
import { AlertTriangle, ShoppingBag, Truck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing } from "../theme";
import {
  CartSavings,
  CartTotals,
  Empty,
  QuantityControl,
  ScreenHeader,
  StockLabel,
} from "../components";
import { getProduct, getStore } from "../data";
import { formatMoney } from "../model";
import { useAppStore } from "../store";
import { findStockIssues, summariseCart } from "../totals";

export function StockIssueNotice({ style }: { style?: any }) {
  const cart = useAppStore((state) => state.cart);
  const setQuantity = useAppStore((state) => state.setQuantity);
  const issues = findStockIssues(cart);

  if (!issues.length) return null;

  return (
    <View style={[styles.issueBox, style]}>
      <View style={styles.issueHeader}>
        <AlertTriangle size={18} color={colors.destructive} />
        <Text style={styles.issueTitle}>Update your cart to continue</Text>
      </View>
      <View style={styles.issueList}>
        {issues.map((issue) => (
          <View key={issue.productId} style={styles.issueItem}>
            <View style={styles.issueInfo}>
              <Text style={styles.issueName} numberOfLines={1}>
                {issue.name}
              </Text>
              <Text style={styles.issueSub}>
                {issue.kind === "out-of-stock"
                  ? "Out of stock at this store"
                  : `Only ${issue.available} left, you picked ${issue.requested}`}
              </Text>
            </View>
            <Pressable
              onPress={() => setQuantity(issue.productId, issue.available)}
              style={({ pressed }) => [styles.issueActionBtn, pressed && styles.pressed]}
            >
              <Text style={styles.issueActionText}>
                {issue.kind === "out-of-stock" ? "Remove" : `Keep ${issue.available}`}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

export function CartScreen() {
  const router = useRouter();
  const cart = useAppStore((state) => state.cart);
  const storeId = useAppStore((state) => state.cartStoreId);
  const store = storeId ? getStore(storeId) : undefined;

  if (!cart.length) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.safeHeader}>
          <ScreenHeader title="Your cart" />
        </SafeAreaView>
        <Empty
          icon={ShoppingBag}
          title="Your cart is empty"
          text="Add a few essentials from a nearby store."
          action={
            <Pressable
              onPress={() => router.push("/")}
              style={({ pressed }) => [styles.browseStoresBtn, pressed && styles.pressed]}
            >
              <Text style={styles.browseStoresText}>Browse stores</Text>
            </Pressable>
          }
          suggest
        />
      </View>
    );
  }

  const summary = summariseCart(cart, storeId);
  const blocked = findStockIssues(cart).length > 0 || !summary.meetsMinimum;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <ScreenHeader title="Your cart" />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Store banner */}
        <View style={styles.storeBanner}>
          <Text style={styles.orderingFromLabel}>Ordering from</Text>
          <Text style={styles.storeName}>{store?.name}</Text>
          <View style={styles.deliveryBadge}>
            <Truck size={14} color={colors.primary} />
            <Text style={styles.deliveryBadgeText}>Delivery from this store</Text>
          </View>
        </View>

        {/* Cart items */}
        <View style={styles.cartList}>
          {cart.map((line) => {
            const product = getProduct(line.productId);
            if (!product) return null;
            const imageSource =
              typeof product.image === "string" ? { uri: product.image } : product.image;

            return (
              <View key={line.productId} style={styles.cartItem}>
                <Image source={imageSource} style={styles.itemImage} resizeMode="contain" />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.itemUnit}>{product.unit}</Text>
                  <StockLabel product={product} style={styles.stockMargin} />
                  <Text style={styles.itemTotal}>
                    {formatMoney(product.price * line.quantity)}
                  </Text>
                </View>
                <QuantityControl productId={product.id} compact />
              </View>
            );
          })}
        </View>

        {/* Stock issues */}
        <StockIssueNotice style={styles.sectionMargin} />

        {/* Minimum order notice */}
        {!summary.meetsMinimum && (
          <View style={styles.minOrderNotice}>
            <Text style={styles.minOrderText}>
              Add {formatMoney(summary.minOrderGap)} more to reach this store’s minimum order.
            </Text>
          </View>
        )}

        {/* Cart Savings */}
        <View style={styles.sectionMargin}>
          <CartSavings />
        </View>

        {/* Bill details */}
        <View style={styles.billSection}>
          <Text style={styles.billHeading}>Bill details</Text>
          <CartTotals />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
        <Pressable
          onPress={() => !blocked && router.push("/checkout")}
          disabled={blocked}
          style={({ pressed }) => [
            styles.checkoutBtn,
            blocked && styles.disabledBtn,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Continue to checkout"
        >
          <Text style={styles.checkoutBtnText}>Continue to checkout</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeHeader: {
    backgroundColor: colors.card,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  browseStoresBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: "center",
  },
  browseStoresText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  storeBanner: {
    borderBottomWidth: 8,
    borderBottomColor: colors.muted,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  orderingFromLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
    marginTop: 2,
  },
  deliveryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  deliveryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  cartList: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  itemUnit: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  stockMargin: {
    marginTop: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.foreground,
    marginTop: 4,
  },
  sectionMargin: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  minOrderNotice: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.offerSoft,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  minOrderText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.offerForeground,
  },
  billSection: {
    borderTopWidth: 8,
    borderTopColor: colors.muted,
    backgroundColor: colors.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  billHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  issueBox: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(212, 52, 31, 0.4)",
    backgroundColor: "rgba(212, 52, 31, 0.05)",
    padding: spacing.md,
  },
  issueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.destructive,
  },
  issueList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  issueItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  issueInfo: {
    flex: 1,
  },
  issueName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
  },
  issueSub: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  issueActionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  issueActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
  },
  bottomBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    ...shadows.elevated,
  },
  checkoutBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryForeground,
  },
  pressed: {
    opacity: 0.8,
  },
});

import React, { useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, Image, Pressable } from "react-native";
import { ChevronRight, Heart, PackageCheck, ShoppingBag } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import { Empty, FloatingCartBar, QuantityControl, ScreenHeader } from "../components";
import { getStore } from "../data";
import { categoryColors, formatMoney, getStockStatus } from "../model";
import { productQuery } from "../queries";
import { useAppStore } from "../store";

export function ProductDetailScreen({ productId }: { productId: string }) {
  const router = useRouter();
  const { data: product } = useQuery(productQuery(productId));
  const wishlist = useAppStore((state) => state.wishlist);
  const toggleWishlist = useAppStore((state) => state.toggleWishlist);
  const markViewed = useAppStore((state) => state.markViewed);

  useEffect(() => {
    if (product) markViewed(product.id);
  }, [markViewed, product]);

  if (!product) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]}>
          <ScreenHeader title="Product unavailable" />
        </SafeAreaView>
        <Empty
          icon={ShoppingBag}
          title="Product unavailable"
          text="This product could not be found."
        />
      </View>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const store = getStore(product.storeId);
  const style = categoryColors[product.category] ?? {
    bg: colors.freshSoft,
    text: colors.freshText,
  };
  const stock = getStockStatus(product);
  const discount =
    product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  const imageSource = typeof product.image === "string" ? { uri: product.image } : product.image;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <ScreenHeader
          title="Product"
          action={
            <Pressable
              onPress={() => toggleWishlist(product.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                size={22}
                color={isWishlisted ? colors.destructive : colors.foreground}
                fill={isWishlisted ? colors.destructive : "transparent"}
              />
            </Pressable>
          }
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Large Product Image Box */}
        <View style={[styles.imageContainer, { backgroundColor: style.bg }]}>
          <Image source={imageSource} style={styles.productImage} resizeMode="contain" />
        </View>

        {/* Primary Info */}
        <View style={styles.infoSection}>
          <View style={styles.chipsRow}>
            <View style={[styles.categoryChip, { backgroundColor: style.bg }]}>
              <Text style={[styles.categoryChipText, { color: style.text }]}>
                {product.category}
              </Text>
            </View>
            {discount > 0 && (
              <View style={styles.discountChip}>
                <Text style={styles.discountChipText}>{discount}% OFF</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.unitBrand}>
            {product.unit} · {product.brand}
          </Text>

          <View style={styles.pricingRow}>
            <Text style={styles.price}>{formatMoney(product.price)}</Text>
            {discount > 0 && (
              <Text style={styles.mrp}>{formatMoney(product.mrp)}</Text>
            )}
          </View>

          <View
            style={[
              styles.stockBadge,
              !stock.available
                ? styles.stockBadgeOut
                : stock.low
                ? styles.stockBadgeLow
                : styles.stockBadgeIn,
            ]}
          >
            <PackageCheck
              size={14}
              color={
                !stock.available
                  ? colors.mutedForeground
                  : stock.low
                  ? colors.offerForeground
                  : colors.freshText
              }
            />
            <Text
              style={[
                styles.stockBadgeText,
                !stock.available
                  ? styles.stockTextOut
                  : stock.low
                  ? styles.stockTextLow
                  : styles.stockTextIn,
              ]}
            >
              {stock.label}
            </Text>
          </View>

          <View style={styles.actionWrap}>
            {stock.available ? (
              <QuantityControl productId={product.id} />
            ) : (
              <View style={styles.unavailableBtn}>
                <Text style={styles.unavailableBtnText}>Currently unavailable</Text>
              </View>
            )}
          </View>
        </View>

        {/* About this item */}
        <View style={styles.dividedSection}>
          <Text style={styles.sectionHeading}>About this item</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Sold by */}
        {store ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/store/[storeId]",
                params: { storeId: store.id },
              })
            }
            style={({ pressed }) => [styles.storeLink, pressed && styles.pressed]}
          >
            <View>
              <Text style={styles.soldByLabel}>Sold by</Text>
              <Text style={styles.soldByStore}>{store.name}</Text>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </ScrollView>

      <FloatingCartBar bottomOffset={20} />
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
    paddingBottom: 90,
  },
  imageContainer: {
    height: 280,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  infoSection: {
    backgroundColor: colors.card,
    padding: spacing.xl,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  discountChip: {
    backgroundColor: colors.offerSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  discountChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.offerForeground,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
    lineHeight: 28,
    marginTop: spacing.sm,
  },
  unitBrand: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  price: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.foreground,
  },
  mrp: {
    fontSize: 14,
    color: colors.mutedForeground,
    textDecorationLine: "line-through",
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 6,
    marginTop: spacing.md,
  },
  stockBadgeIn: {
    backgroundColor: colors.freshSoft,
  },
  stockBadgeLow: {
    backgroundColor: colors.offerSoft,
  },
  stockBadgeOut: {
    backgroundColor: colors.muted,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  stockTextIn: {
    color: colors.freshText,
  },
  stockTextLow: {
    color: colors.offerForeground,
  },
  stockTextOut: {
    color: colors.mutedForeground,
  },
  actionWrap: {
    marginTop: spacing.xl,
  },
  unavailableBtn: {
    height: 46,
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableBtnText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  dividedSection: {
    borderTopWidth: 8,
    borderTopColor: colors.muted,
    backgroundColor: colors.card,
    padding: spacing.xl,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
  },
  storeLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.xl,
  },
  soldByLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  soldByStore: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});

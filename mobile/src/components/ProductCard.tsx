import React from "react";
import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import { Heart } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors, radius, shadows, spacing } from "../theme";
import { categoryColors, formatMoney, getStockStatus, type Product } from "../model";
import { useAppStore } from "../store";
import { StockLabel } from "./StockLabel";
import { QuantityControl } from "./QuantityControl";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const wishlist = useAppStore((state) => state.wishlist);
  const toggleWishlist = useAppStore((state) => state.toggleWishlist);
  const isWishlisted = wishlist.includes(product.id);

  const style = categoryColors[product.category] ?? { bg: colors.freshSoft, text: colors.freshText };
  const stock = getStockStatus(product);
  const discount =
    product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  const imageSource = typeof product.image === "string" ? { uri: product.image } : product.image;

  const handlePress = () => {
    router.push({
      pathname: "/product/[productId]",
      params: { productId: product.id },
    });
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={handlePress} style={[styles.imageContainer, { backgroundColor: style.bg }]}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
        {!stock.available && (
          <View style={styles.soldOutBanner}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={() => toggleWishlist(product.id)}
        style={({ pressed }) => [styles.wishlistBtn, pressed && styles.pressed]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          size={16}
          color={isWishlisted ? colors.destructive : colors.mutedForeground}
          fill={isWishlisted ? colors.destructive : "transparent"}
        />
      </Pressable>

      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}% OFF</Text>
        </View>
      )}

      <Pressable onPress={handlePress} style={styles.details}>
        <Text style={[styles.category, { color: style.text }]}>{product.category}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.unit}>{product.unit}</Text>
        <StockLabel product={product} style={styles.stockLabel} />
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatMoney(product.price)}</Text>
          {discount > 0 && (
            <Text style={styles.mrp}>{formatMoney(product.mrp)}</Text>
          )}
        </View>
        {stock.available ? (
          <QuantityControl productId={product.id} compact />
        ) : (
          <Text style={styles.unavailableText}>Unavailable</Text>
        )}
      </View>
    </View>
  );
}

export function MiniProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const style = categoryColors[product.category] ?? { bg: colors.freshSoft, text: colors.freshText };
  const imageSource = typeof product.image === "string" ? { uri: product.image } : product.image;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[productId]",
          params: { productId: product.id },
        })
      }
      style={({ pressed }) => [styles.miniCard, pressed && styles.pressed]}
    >
      <View style={[styles.miniImageContainer, { backgroundColor: style.bg }]}>
        <Image source={imageSource} style={styles.miniImage} resizeMode="contain" />
      </View>
      <Text style={styles.miniName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.miniPrice}>{formatMoney(product.price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    flex: 1,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.sm,
    ...shadows.sm,
  },
  imageContainer: {
    aspectRatio: 1,
    width: "100%",
    borderRadius: radius.xl,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  soldOutBanner: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(56, 52, 46, 0.9)",
    borderRadius: radius.sm,
    paddingVertical: 4,
    alignItems: "center",
  },
  soldOutText: {
    color: colors.card,
    fontSize: 11,
    fontWeight: "700",
  },
  wishlistBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  discountBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: colors.offerSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.offerForeground,
  },
  details: {
    paddingHorizontal: 4,
    paddingTop: spacing.md,
    paddingBottom: 4,
  },
  category: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.foreground,
    lineHeight: 18,
  },
  unit: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  stockLabel: {
    marginTop: 6,
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: spacing.sm,
    paddingBottom: 4,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
  },
  mrp: {
    fontSize: 11,
    color: colors.mutedForeground,
    textDecorationLine: "line-through",
    marginTop: 1,
  },
  unavailableText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
  // MiniProductCard
  miniCard: {
    width: 108,
    marginRight: spacing.md,
  },
  miniImageContainer: {
    width: 108,
    height: 108,
    borderRadius: radius.xl,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },
  miniImage: {
    width: "100%",
    height: "100%",
  },
  miniName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.foreground,
    lineHeight: 16,
    marginTop: 6,
  },
  miniPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.foreground,
    marginTop: 2,
  },
});

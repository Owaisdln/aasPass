import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { Heart } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import { Empty, FloatingCartBar, ProductCard } from "../components";
import { products } from "../data";
import { useAppStore } from "../store";

export function WishlistScreen() {
  const wishlist = useAppStore((state) => state.wishlist);
  const wishlistSync = useAppStore((state) => state.wishlistSync);
  const wishedProducts = products.filter((product) => wishlist.includes(product.id));

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.eyebrow}>Default list</Text>
        <Text style={styles.headerTitle}>My essentials</Text>
        <Text style={styles.syncStatus}>
          {wishlistSync === "synced" && "Synced with your account"}
          {wishlistSync === "syncing" && "Syncing with your account…"}
          {wishlistSync === "error" &&
            "Couldn't reach the server — changes are kept on this device"}
          {wishlistSync === "local" &&
            "Saved on this device · sign in to sync across devices"}
        </Text>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {wishedProducts.length ? (
          <View style={styles.grid}>
            {wishedProducts.map((product) => (
              <View key={product.id} style={styles.gridCol}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        ) : (
          <Empty
            icon={Heart}
            title="Your wishlist is empty"
            text="Tap the heart on a product to save it here."
          />
        )}
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
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
    marginTop: 2,
  },
  syncStatus: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 90,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
    rowGap: spacing.md,
  },
  gridCol: {
    width: "50%",
    paddingHorizontal: spacing.xs,
  },
});

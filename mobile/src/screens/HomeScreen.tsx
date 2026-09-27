import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
} from "react-native";
import {
  Apple,
  Cookie,
  Croissant,
  Cross,
  CupSoda,
  Milk,
  Search,
  Sparkles,
  SprayCan,
  type LucideIcon,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing } from "../theme";
import {
  DeliveryPromise,
  FloatingCartBar,
  LocationPicker,
  MiniProductCard,
  ProductCard,
  RepeatOrderCard,
  StoreCard,
} from "../components";
import { getProduct, logoMark } from "../data";
import {
  categoryColors,
  getStoreHoursStatus,
  isInStock,
  type Category,
} from "../model";
import { productsQuery, storesQuery } from "../queries";
import { useAppStore } from "../store";

const categoryIcons: Record<Category, LucideIcon> = {
  "Fruits & Veggies": Apple,
  Dairy: Milk,
  Bakery: Croissant,
  Snacks: Cookie,
  Beverages: CupSoda,
  "Personal Care": Sparkles,
  Household: SprayCan,
  Health: Cross,
};

export function HomeScreen() {
  const router = useRouter();
  const { data: stores = [], error: storesError, refetch: refetchStores } = useQuery(storesQuery);
  const { data: allProducts = [], error: productsError, refetch: refetchProducts } = useQuery(productsQuery);
  const [refreshing, setRefreshing] = useState(false);
  const categories = [...new Set(allProducts.map((product) => product.category).filter(Boolean))];

  const lastOrder = useAppStore(
    (state) => state.orders.find((order) => order.status === "PENDING") ?? state.orders[0]
  );
  const recentlyViewed = useAppStore((state) => state.recentlyViewed);
  const catalogError = storesError || productsError;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStores(), refetchProducts()]);
    setRefreshing(false);
  };

  const nearestStore = stores[0];
  const featured = stores.slice(0, 4);

  const popular = useMemo(() => {
    const byStore = stores.map((store) =>
      allProducts.filter((product) => product.storeId === store.id && isInStock(product))
    );
    const mixed: typeof allProducts = [];
    for (let index = 0; mixed.length < 6 && index < 6; index += 1) {
      for (const list of byStore) {
        const item = list[index];
        if (item && mixed.length < 6) mixed.push(item);
      }
    }
    return mixed;
  }, [allProducts, stores]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Hero Section */}
        <View style={styles.heroSection}>
          <SafeAreaView edges={["top"]} style={styles.heroSafe}>
            <View style={styles.topBar}>
              <LocationPicker variant="header" />
              <Image source={logoMark} style={styles.logoMark} resizeMode="contain" />
            </View>

            <Text style={styles.greetingTitle}>Good morning! 👋</Text>
            <Text style={styles.greetingSubtitle}>Your neighbourhood, delivered.</Text>

            <Pressable
              onPress={() => router.push("/search")}
              style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Search groceries, pharmacy and more"
            >
              <Search size={18} color={colors.mutedForeground} />
              <Text style={styles.searchPlaceholder}>
                Search groceries, pharmacy &amp; more
              </Text>
            </Pressable>

            {nearestStore ? (
              <View style={styles.promiseWrap}>
                <DeliveryPromise store={nearestStore} tone="dark" />
              </View>
            ) : null}
          </SafeAreaView>
        </View>

        {catalogError ? (
          <View style={styles.catalogError}>
            <Text style={styles.catalogErrorTitle}>Could not load stores and products</Text>
            <Text style={styles.catalogErrorText}>
              {catalogError instanceof Error ? catalogError.message : "Check the server connection and try again."}
            </Text>
            <Pressable
              onPress={() => void Promise.all([refetchStores(), refetchProducts()])}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Repeat Order Card */}
        {lastOrder ? (
          <View style={styles.sectionWrap}>
            <RepeatOrderCard orderId={lastOrder.id} />
          </View>
        ) : null}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionEyebrow}>Recently viewed</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recentlyViewed.map((id) => {
                const product = getProduct(id);
                return product ? <MiniProductCard key={id} product={product} /> : null;
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Shop by Category */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionEyebrow}>Shop by category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const style = categoryColors[category] ?? {
                bg: colors.freshSoft,
                text: colors.freshText,
              };
              const Icon = categoryIcons[category] ?? Apple;
              return (
                <Pressable
                  key={category}
                  onPress={() =>
                    router.push({
                      pathname: "/search",
                      params: { q: category },
                    })
                  }
                  style={({ pressed }) => [styles.categoryItem, pressed && styles.pressed]}
                >
                  <View style={[styles.categoryIconWrap, { backgroundColor: style.bg }]}>
                    <Icon size={24} color={style.text} />
                  </View>
                  <Text style={styles.categoryText} numberOfLines={2}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Featured Stores */}
        <View style={styles.dividedSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrowGreen}>Browse</Text>
              <Text style={styles.sectionHeading}>Stores</Text>
            </View>
            <Text style={styles.sectionCount}>{featured.length} nearby</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {featured.map((store) => (
              <StoreCard key={store.id} store={store} featured />
            ))}
          </ScrollView>
        </View>

        {/* Popular Near You */}
        <View style={styles.dividedSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrowGreen}>Available now</Text>
              <Text style={styles.sectionHeading}>Popular products</Text>
            </View>
            <Pressable onPress={() => router.push("/search")}>
              <Text style={styles.seeAllLink}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.productsGrid}>
            {popular.map((product) => (
              <View key={product.id} style={styles.productGridCol}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </View>

        {/* All Local Stores */}
        <View style={styles.dividedSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.eyebrowGreen}>Browse all</Text>
              <Text style={styles.sectionHeading}>All stores</Text>
            </View>
            <Text style={styles.sectionCount}>
              {stores.filter((s) => getStoreHoursStatus(s).open).length} open now
            </Text>
          </View>

          <View style={styles.storesList}>
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      <FloatingCartBar bottomOffset={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  heroSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroSafe: {
    paddingTop: spacing.xs,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoMark: {
    width: 36,
    height: 36,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primaryForeground,
    marginTop: spacing.lg,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: colors.primaryForeground,
    opacity: 0.85,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    height: 48,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  promiseWrap: {
    marginTop: spacing.md,
  },
  sectionWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  catalogError: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  catalogErrorTitle: {
    color: colors.destructive,
    fontSize: 14,
    fontWeight: "700",
  },
  catalogErrorText: {
    color: colors.foreground,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  retryButtonText: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  horizontalScroll: {
    paddingRight: spacing.lg,
  },
  categoriesSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.lg,
  },
  categoryItem: {
    width: "25%",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  categoryIconWrap: {
    width: 58,
    height: 58,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(227, 223, 214, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "center",
    lineHeight: 14,
  },
  dividedSection: {
    borderTopWidth: 8,
    borderTopColor: colors.muted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  eyebrowGreen: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.foreground,
    marginTop: 2,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
    rowGap: spacing.md,
  },
  productGridCol: {
    width: "50%",
    paddingHorizontal: spacing.xs,
  },
  storesList: {
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
});

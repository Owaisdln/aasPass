import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { Store as StoreIcon } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import {
  DeliveryPromise,
  Empty,
  FloatingCartBar,
  ProductCard,
  ScreenHeader,
  Stat,
  StoreStatusBadge,
} from "../components";
import { getStoreHoursStatus } from "../model";
import { productsQuery, storeQuery } from "../queries";

export function StoreDetailScreen({ storeId }: { storeId: string }) {
  const { data: store } = useQuery(storeQuery(storeId));
  const { data: allProducts = [] } = useQuery(productsQuery);

  if (!store) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]}>
          <ScreenHeader title="Store unavailable" />
        </SafeAreaView>
        <Empty
          icon={StoreIcon}
          title="Store unavailable"
          text="This store could not be found."
        />
      </View>
    );
  }

  const storeProducts = allProducts.filter((p) => p.storeId === store.id);
  const StoreMark = StoreIcon;
  const hours = getStoreHoursStatus(store);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <ScreenHeader title={store.name} />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Store Green Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroInfoRow}>
            <View style={styles.heroIconBox}>
              <StoreMark size={36} color={colors.primary} />
            </View>
            <View style={styles.heroTextContent}>
              <Text style={styles.hoursStatusLabel}>
                {hours.open ? "Open now" : "Closed"}
              </Text>
              <Text style={styles.storeHeroName}>{store.name}</Text>
              <Text style={styles.storeHeroKind}>{store.kind}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Stat value={`₹${store.minOrder}`} label="Minimum order" />
            </View>
          </View>
        </View>

        {/* Store badge & Note */}
        <View style={styles.badgeBar}>
          <StoreStatusBadge store={store} />
          <Text style={styles.bullet}>•</Text>
          {store.note ? <Text style={styles.noteText}>{store.note}</Text> : null}
        </View>

        <View style={styles.promiseWrap}>
          <DeliveryPromise store={store} />
        </View>

        {/* Shop essentials grid */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionHeading}>Shop essentials</Text>
          <View style={styles.productsGrid}>
            {storeProducts.map((product) => (
              <View key={product.id} style={styles.productGridCol}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </View>
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
  heroSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  heroInfoRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContent: {
    flex: 1,
  },
  hoursStatusLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.primaryForeground,
    opacity: 0.8,
  },
  storeHeroName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primaryForeground,
    marginTop: 2,
  },
  storeHeroKind: {
    fontSize: 13,
    color: colors.primaryForeground,
    opacity: 0.85,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(250, 251, 249, 0.12)",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(250, 251, 249, 0.2)",
  },
  badgeBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  bullet: {
    color: colors.border,
  },
  noteText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  promiseWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  productsSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.lg,
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
});

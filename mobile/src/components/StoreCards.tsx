import React from "react";
import { StyleSheet, Text, View, Pressable, type ViewStyle } from "react-native";
import { ChevronRight, ShoppingBag, Truck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors, radius, shadows, spacing } from "../theme";
import { formatMoney, getStoreHoursStatus, type Store } from "../model";

export function StoreStatusBadge({ store, style }: { store: Store; style?: ViewStyle }) {
  const status = getStoreHoursStatus(store);
  return (
    <View
      style={[
        styles.badge,
        status.open ? styles.openBadge : styles.closedBadge,
        style,
      ]}
    >
      <View
        style={[
          styles.badgeDot,
          status.open ? styles.openDot : styles.closedDot,
        ]}
      />
      <Text
        style={[
          styles.badgeText,
          status.open ? styles.openText : styles.closedText,
        ]}
      >
        {status.label}
        {!status.open && " · Pre-order available"}
      </Text>
    </View>
  );
}

export function DeliveryPromise({
  store,
  tone = "light",
}: {
  store: Store;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  const items = [
    { icon: Truck, label: "Fast local delivery" },
    { icon: ShoppingBag, label: `Min. order ${formatMoney(store.minOrder)}` },
    ...(store.freeDeliveryAbove == null
      ? []
      : [{ icon: Truck, label: `Free above ${formatMoney(store.freeDeliveryAbove)}` }]),
  ];

  return (
    <View
      style={[
        styles.promiseContainer,
        isDark ? styles.promiseDark : styles.promiseLight,
      ]}
    >
      {items.map(({ icon: Icon, label }) => (
        <View key={label} style={styles.promiseItem}>
          <Icon
            size={16}
            color={isDark ? colors.primaryForeground : colors.primary}
          />
          <Text
            style={[
              styles.promiseLabel,
              isDark ? styles.promiseLabelDark : styles.promiseLabelLight,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const storeIconData = () => ({ Icon: ShoppingBag, bg: colors.freshSoft });

export function StoreCard({
  store,
  featured = false,
}: {
  store: Store;
  featured?: boolean;
}) {
  const router = useRouter();
  const { Icon, bg } = storeIconData();

  const handlePress = () => {
    router.push({
      pathname: "/store/[storeId]",
      params: { storeId: store.id },
    });
  };

  if (featured) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}
      >
        <View style={[styles.featuredHeader, { backgroundColor: bg }]}>
          <Icon size={32} color={colors.primary} />
        </View>
        <View style={styles.featuredBody}>
          <View style={styles.featuredTopRow}>
            <Text style={styles.featuredTitle} numberOfLines={1}>
              {store.name}
            </Text>
          </View>
          <Text style={styles.storeKind} numberOfLines={1}>
            {store.kind}
          </Text>
          <StoreStatusBadge store={store} style={styles.badgeSpacing} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}
    >
      <View style={[styles.rowIconBox, { backgroundColor: bg }]}>
        <Icon size={28} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {store.name}
          </Text>
        </View>
        <Text style={styles.storeKind} numberOfLines={1}>
          {store.kind}
        </Text>
        <StoreStatusBadge store={store} style={styles.badgeSpacing} />
        {store.note ? <Text style={styles.noteText} numberOfLines={1}>{store.note}</Text> : null}
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 5,
  },
  openBadge: {
    backgroundColor: colors.freshSoft,
  },
  closedBadge: {
    backgroundColor: colors.offerSoft,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  openDot: {
    backgroundColor: colors.freshText,
  },
  closedDot: {
    backgroundColor: colors.offer,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  openText: {
    color: colors.freshText,
  },
  closedText: {
    color: colors.offer,
  },
  badgeSpacing: {
    marginTop: 6,
  },
  promiseContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  promiseLight: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted,
  },
  promiseDark: {
    backgroundColor: "rgba(250, 251, 249, 0.12)",
  },
  promiseItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  promiseLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  promiseLabelLight: {
    color: colors.foreground,
  },
  promiseLabelDark: {
    color: colors.primaryForeground,
  },
  featuredCard: {
    width: 200,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
    marginRight: spacing.md,
    ...shadows.sm,
  },
  featuredHeader: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredBody: {
    padding: spacing.md,
  },
  featuredTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
    marginRight: 6,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
  },
  storeKind: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  distanceText: {
    fontSize: 11,
    color: colors.foreground,
    fontWeight: "500",
    marginTop: 6,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  rowIconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
    marginRight: spacing.sm,
  },
  noteText: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});

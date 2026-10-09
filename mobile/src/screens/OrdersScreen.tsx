import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { ChevronRight, Package } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import { Empty, FloatingCartBar, RepeatOrderCard } from "../components";
import { getStore } from "../data";
import { formatMoney } from "../model";
import { useAppStore } from "../store";

export function OrdersScreen() {
  const router = useRouter();
  const orders = useAppStore((state) => state.orders);
  const syncOrders = useAppStore((state) => state.syncOrders);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncOrders();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.headerTitle}>Your orders</Text>
      </SafeAreaView>

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
        {orders[0] ? (
          <View style={styles.repeatOrderWrap}>
            <RepeatOrderCard orderId={orders[0].id} />
          </View>
        ) : null}

        {orders.length ? (
          <View style={styles.ordersList}>
            {orders.map((order) => {
              const store = getStore(order.storeId);
              const itemCount = (order.lines ?? order.items).length;
              const isCancelled = order.status === "CANCELLED" || order.status === "FAILED";

              return (
                <Pressable
                  key={order.id}
                  onPress={() =>
                    router.push({
                      pathname: "/order/[orderId]",
                      params: { orderId: order.id },
                    })
                  }
                  style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}
                >
                  <View style={styles.iconBox}>
                    <Package size={24} color={colors.primary} />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.storeName}>{store?.name ?? "Local store"}</Text>
                    <Text style={styles.metaText}>
                      #{order.orderNumber ?? order.id} · {itemCount} {itemCount === 1 ? "item" : "items"}
                    </Text>
                    <Text
                      style={[
                        styles.statusText,
                        isCancelled ? styles.statusCancelled : styles.statusPlaced,
                      ]}
                    >
                      {order.statusLabel ?? (isCancelled ? "Cancelled" : "Placed")}
                    </Text>
                  </View>
                  <View style={styles.priceWrap}>
                    <Text style={styles.totalPrice}>{formatMoney(order.total)}</Text>
                    <ChevronRight size={18} color={colors.mutedForeground} style={styles.chevron} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Empty
            icon={Package}
            title="No orders yet"
            text="Your local-store orders will appear here."
            action={
              <Pressable
                onPress={() => router.push("/")}
                style={({ pressed }) => [styles.startShoppingBtn, pressed && styles.pressed]}
              >
                <Text style={styles.startShoppingText}>Start shopping</Text>
              </Pressable>
            }
            suggest
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  repeatOrderWrap: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  ordersList: {
    backgroundColor: colors.card,
    marginTop: spacing.md,
  },
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  orderInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
  },
  metaText: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  statusPlaced: {
    color: colors.primary,
  },
  statusCancelled: {
    color: colors.destructive,
  },
  priceWrap: {
    alignItems: "flex-end",
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
  },
  chevron: {
    marginTop: 6,
  },
  startShoppingBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: "center",
  },
  startShoppingText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});

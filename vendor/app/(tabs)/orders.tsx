import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react-native";
import * as api from "../../src/features/vendor/api/vendor";
import type { Order, OrderStatus } from "../../src/features/vendor/model";
import { formatINR, ORDER_STATUS_LABEL } from "../../src/features/vendor/rules";
import {
  Card,
  EmptyState,
  ErrorNote,
  Loading,
  palette,
  Screen,
  Section,
  Tag,
  timeAgo,
  TopBar,
} from "../../src/native/ui";

const tabs: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "new", label: "New", statuses: ["PENDING"] },
  {
    key: "active",
    label: "In progress",
    statuses: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
  },
  { key: "past", label: "Past", statuses: ["DELIVERED", "CANCELLED", "FAILED"] },
];

export default function OrdersScreen() {
  const [selected, setSelected] = useState("new");
  const orders = useQuery({ queryKey: ["vendor", "orders"], queryFn: api.getOrders });
  const store = useQuery({ queryKey: ["vendor", "store"], queryFn: api.getMyStore });
  const list = orders.data ?? [];
  const tab = tabs.find((item) => item.key === selected) ?? tabs[0]!;
  const shown = list.filter((order) => tab.statuses.includes(order.status));
  const completed = list.filter((order) => order.status === "DELIVERED");

  return (
    <Screen>
      <TopBar title="Orders" subtitle={store.data?.name ?? "Your store"} />
      <Section>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Stat
            label="New"
            value={String(list.filter((order) => order.status === "PENDING").length)}
          />
          <Stat
            label="In progress"
            value={String(list.filter((order) => tabs[1]!.statuses.includes(order.status)).length)}
          />
          <Stat
            label="Completed"
            value={formatINR(completed.reduce((sum, order) => sum + order.totalAmount, 0)).replace(
              ".00",
              "",
            )}
          />
        </View>
      </Section>
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderColor: palette.border,
          marginTop: 12,
          backgroundColor: "#fff",
        }}
      >
        {tabs.map((item) => {
          const count = list.filter((order) => item.statuses.includes(order.status)).length;
          const active = selected === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setSelected(item.key)}
              style={{
                flex: 1,
                paddingVertical: 13,
                alignItems: "center",
                borderBottomWidth: active ? 2 : 0,
                borderBottomColor: palette.primary,
              }}
            >
              <Text
                style={{
                  color: active ? palette.primary : palette.muted,
                  fontSize: 13,
                  fontWeight: "800",
                }}
              >
                {item.label} · {count}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {orders.isLoading ? (
        <Loading />
      ) : orders.error ? (
        <ErrorNote message={orders.error.message} />
      ) : (
        <Section>
          {shown.length === 0 ? (
            <EmptyState
              title="No orders here"
              body="New orders and order updates will appear here."
            />
          ) : (
            <View style={{ gap: 9 }}>
              {shown.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </View>
          )}
        </Section>
      )}
      <Section>
        <Card style={{ backgroundColor: "#EDF5EF" }}>
          <Text style={{ color: palette.ink, fontSize: 12, lineHeight: 18 }}>
            Sample orders are for preview only. Store-side orders are not yet available from the
            live backend.
          </Text>
        </Card>
      </Section>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: 10 }}>
      <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 16, fontWeight: "900" }}>
        {value}
      </Text>
      <Text style={{ color: palette.muted, fontSize: 10, fontWeight: "700" }}>{label}</Text>
    </Card>
  );
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = useMemo(
    () => order.items.reduce((sum, item) => sum + item.quantity, 0),
    [order.items],
  );
  const tone =
    order.status === "PENDING"
      ? "yellow"
      : order.status === "DELIVERED"
        ? "green"
        : ["FAILED", "CANCELLED"].includes(order.status)
          ? "red"
          : "neutral";
  return (
    <Link href={{ pathname: "/orders/[orderId]", params: { orderId: order.id } }} asChild>
      <Pressable>
        <Card
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderColor: order.status === "PENDING" ? "#EBCB7A" : palette.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <Text style={{ color: palette.ink, fontWeight: "900" }}>#{order.orderNumber}</Text>
              <Tag text={ORDER_STATUS_LABEL[order.status]} tone={tone} />
            </View>
            <Text style={{ color: palette.ink, fontSize: 13 }} numberOfLines={1}>
              {order.deliveryReceiverName} · {itemCount} item{itemCount === 1 ? "" : "s"}
            </Text>
            <Text style={{ color: palette.muted, fontSize: 11, marginTop: 3 }}>
              {timeAgo(order.placedAt)} ·{" "}
              {order.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"} ·{" "}
              {order.paymentMethod === "COD" ? "Cash" : "Paid online"}
            </Text>
          </View>
          <Text style={{ color: palette.ink, fontWeight: "900" }}>
            {formatINR(order.totalAmount)}
          </Text>
          <ChevronRight size={18} color={palette.muted} />
        </Card>
      </Pressable>
    </Link>
  );
}

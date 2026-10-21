import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { MapPin, Phone } from "lucide-react-native";
import * as api from "../../src/features/vendor/api/vendor";
import type { OrderStatus } from "../../src/features/vendor/model";
import {
  nextOrderStatuses,
  ORDER_ACTION_LABEL,
  ORDER_STATUS_LABEL,
  formatINR,
} from "../../src/features/vendor/rules";
import {
  ActionButton,
  Card,
  ErrorNote,
  Loading,
  palette,
  Screen,
  Section,
  Tag,
  timeAgo,
  TopBar,
  useVendorMutation,
} from "../../src/native/ui";

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = useQuery({
    queryKey: ["vendor", "order", orderId],
    queryFn: () => api.getOrder(orderId),
  });
  const move = useVendorMutation((status: OrderStatus) => api.setOrderStatus(orderId, status));
  const markPaid = useVendorMutation(() => api.markCodPaid(orderId), "Cash payment recorded");

  if (order.isLoading)
    return (
      <>
        <TopBar title="Order" back />
        <Loading />
      </>
    );
  if (order.error)
    return (
      <>
        <TopBar title="Order" back />
        <ErrorNote message={order.error.message} />
      </>
    );
  const value = order.data;
  if (!value)
    return (
      <>
        <TopBar title="Order" back />
        <Section>
          <Text style={{ color: palette.muted, textAlign: "center" }}>Order not found.</Text>
        </Section>
      </>
    );

  const next = nextOrderStatuses(value.status, value.fulfillmentType);
  const primary = next.find((status) => status !== "CANCELLED" && status !== "FAILED");
  const secondary = next.find((status) => status === "CANCELLED" || status === "FAILED");
  const callCustomer = () => {
    void Linking.openURL(`tel:${value.deliveryPhone}`).catch((error: unknown) => {
      Alert.alert("Unable to call", error instanceof Error ? error.message : value.deliveryPhone);
    });
  };

  return (
    <Screen>
      <TopBar
        title={`#${value.orderNumber}`}
        subtitle={`Placed ${timeAgo(value.placedAt)}`}
        back
        right={
          <Tag
            text={ORDER_STATUS_LABEL[value.status]}
            tone={
              value.status === "PENDING"
                ? "yellow"
                : value.status === "DELIVERED"
                  ? "green"
                  : "neutral"
            }
          />
        }
      />
      <Section title={`Items (${value.items.length})`}>
        <Card style={{ padding: 0 }}>
          {value.items.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
                padding: 12,
                borderBottomWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 4,
                  overflow: "hidden",
                  borderRadius: 7,
                  backgroundColor: "#E8F4EC",
                  color: palette.primaryDark,
                  fontWeight: "900",
                }}
              >
                {item.quantity}×
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.ink, fontSize: 13, fontWeight: "800" }}>
                  {item.productNameSnapshot}
                </Text>
                <Text style={{ marginTop: 3, color: palette.muted, fontSize: 11 }}>
                  {item.unitSnapshot} · {formatINR(item.sellingPriceSnapshot)} each
                </Text>
              </View>
              <Text style={{ color: palette.ink, fontSize: 13, fontWeight: "800" }}>
                {formatINR(item.subtotal)}
              </Text>
            </View>
          ))}
        </Card>
      </Section>
      <Section title="Bill">
        <Card style={{ gap: 9 }}>
          <BillRow label="Items total" value={formatINR(value.subtotal)} />
          {value.discountAmount > 0 ? (
            <BillRow label="Discount" value={`− ${formatINR(value.discountAmount)}`} />
          ) : null}
          {value.taxAmount > 0 ? <BillRow label="Tax" value={formatINR(value.taxAmount)} /> : null}
          <BillRow
            label="Delivery fee"
            value={value.deliveryFee ? formatINR(value.deliveryFee) : "Free"}
          />
          <View style={{ height: 1, backgroundColor: palette.border }} />
          <BillRow label="Total" value={formatINR(value.totalAmount)} bold />
          <BillRow
            label={
              value.paymentMethod === "COD" ? "Cash on delivery" : `Paid by ${value.paymentMethod}`
            }
            value={value.paymentStatus === "PAID" ? "Paid" : "To collect"}
          />
          {value.paymentMethod === "COD" &&
          value.paymentStatus !== "PAID" &&
          ["OUT_FOR_DELIVERY", "READY_FOR_PICKUP", "DELIVERED"].includes(value.status) ? (
            <ActionButton
              title={markPaid.isPending ? "Saving…" : "Cash received"}
              secondary
              disabled={markPaid.isPending}
              onPress={() => markPaid.mutate(undefined)}
            />
          ) : null}
        </Card>
      </Section>
      <Section title={value.fulfillmentType === "PICKUP" ? "Customer pickup" : "Deliver to"}>
        <Card style={{ gap: 9 }}>
          <Text style={{ color: palette.ink, fontSize: 14, fontWeight: "800" }}>
            {value.deliveryReceiverName}
          </Text>
          <Pressable
            onPress={callCustomer}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Phone size={16} color={palette.primary} />
            <Text style={{ color: palette.primary, fontSize: 13, fontWeight: "700" }}>
              {value.deliveryPhone} · Call
            </Text>
          </Pressable>
          {value.fulfillmentType === "DELIVERY" ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <MapPin size={16} color={palette.muted} />
              <Text style={{ flex: 1, color: palette.muted, fontSize: 13, lineHeight: 19 }}>
                {[
                  value.deliveryHouseNo,
                  value.deliveryStreet,
                  value.deliveryArea,
                  value.deliveryLandmark,
                  value.deliveryCity,
                  value.deliveryPincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>
          ) : null}
          {value.deliveryInstructions ? (
            <Text
              style={{
                padding: 10,
                borderRadius: 8,
                color: palette.warning,
                backgroundColor: "#FFF4D6",
                fontSize: 12,
              }}
            >
              “{value.deliveryInstructions}”
            </Text>
          ) : null}
        </Card>
      </Section>
      {next.length > 0 ? (
        <Section>
          <View style={{ gap: 9 }}>
            {secondary ? (
              <ActionButton
                title={ORDER_ACTION_LABEL[secondary] ?? secondary}
                danger
                secondary
                disabled={move.isPending}
                onPress={() =>
                  Alert.alert(
                    `${ORDER_ACTION_LABEL[secondary]}?`,
                    "This changes the order status.",
                    [
                      { text: "Keep order", style: "cancel" },
                      {
                        text: "Confirm",
                        style: "destructive",
                        onPress: () => move.mutate(secondary),
                      },
                    ],
                  )
                }
              />
            ) : null}
            {primary ? (
              <ActionButton
                title={move.isPending ? "Updating…" : (ORDER_ACTION_LABEL[primary] ?? primary)}
                disabled={move.isPending}
                onPress={() => move.mutate(primary)}
              />
            ) : null}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}

function BillRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text
        style={{
          color: bold ? palette.ink : palette.muted,
          fontSize: 13,
          fontWeight: bold ? "900" : "500",
        }}
      >
        {label}
      </Text>
      <Text style={{ color: palette.ink, fontSize: 13, fontWeight: bold ? "900" : "700" }}>
        {value}
      </Text>
    </View>
  );
}

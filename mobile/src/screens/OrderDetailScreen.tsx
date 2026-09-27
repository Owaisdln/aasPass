import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { Check, Package, PackageSearch, Phone, ShieldCheck, Star, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { colors, radius, spacing } from "../theme";
import { Empty, ScreenHeader, Section, Timeline } from "../components";
import { getProduct, getStore } from "../data";
import { formatMoney, type OrderItemReplacement } from "../model";
import { useAppStore, useSelectedAddress } from "../store";
import { deliveryInstructionOptions } from "./CheckoutScreen";

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const order = useAppStore((state) => state.orders.find((item) => item.id === orderId));
  const cancelOrder = useAppStore((state) => state.cancelOrder);
  const address = useSelectedAddress();
  const store = order ? getStore(order.storeId) : undefined;

  if (!order) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]}>
          <ScreenHeader title="Order" backTo="/orders" />
        </SafeAreaView>
        <Empty
          icon={Package}
          title="Order not found"
          text="This demo order is not available in this session."
        />
      </View>
    );
  }

  const pending = order.status === "PENDING";

  const handleCancel = () => {
    Alert.alert(
      "Cancel order?",
      "Are you sure you want to cancel this order?",
      [
        { text: "Keep order", style: "cancel" },
        {
          text: "Cancel order",
          style: "destructive",
          onPress: () => {
            cancelOrder(order.id);
            Toast.show({ type: "success", text1: "Order cancelled" });
          },
        },
      ]
    );
  };

  const handleCallStore = () => {
    if (store?.phone) {
      Linking.openURL(`tel:${store.phone}`).catch(() => {
        Toast.show({ type: "info", text1: `Call store at: ${store.phone}` });
      });
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <ScreenHeader title={`Order #${order.id}`} backTo="/orders" />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Hero */}
        <View style={[styles.statusHero, pending ? styles.statusHeroPlaced : styles.statusHeroCancelled]}>
          <View style={[styles.statusIconCircle, pending ? styles.statusIconPlaced : styles.statusIconCancelled]}>
            {pending ? (
              <Check size={28} color={colors.primaryForeground} />
            ) : (
              <X size={28} color={colors.card} />
            )}
          </View>
          <Text style={styles.statusHeroTitle}>
            {pending ? "Order placed" : "Order cancelled"}
          </Text>
          <Text style={styles.statusHeroStore}>{store?.name}</Text>
        </View>

        {/* Call Store Button */}
        {store ? (
          <View style={styles.callStoreWrap}>
            <Pressable
              onPress={handleCallStore}
              style={({ pressed }) => [styles.callStoreBtn, pressed && styles.pressed]}
            >
              <Phone size={18} color={colors.primary} />
              <Text style={styles.callStoreText}>Call {store.name}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Item substitutions / replacements */}
        {pending &&
          order.replacements.map((replacement) => (
            <ReplacementBanner
              key={replacement.id}
              orderId={order.id}
              replacement={replacement}
            />
          ))}

        {/* Order Status Timeline */}
        <Section title="Order status">
          <Timeline cancelled={!pending} />
        </Section>

        {/* Delivery PIN Code */}
        {pending && order.deliveryPin ? (
          <View style={styles.pinCard}>
            <Text style={styles.pinEyebrow}>Delivery PIN</Text>
            <Text style={styles.pinCode}>{order.deliveryPin}</Text>
            <Text style={styles.pinNote}>
              Share this code with the delivery partner only after you receive your order.
            </Text>
          </View>
        ) : null}

        {/* Delivery / Pickup Address */}
        <Section title={order.fulfilment === "delivery" ? "Delivery address" : "Pickup from"}>
          <Text style={styles.addressLine}>
            {order.fulfilment === "delivery"
              ? address
                ? `${address.line1}, ${address.line2}, ${address.city} ${address.pincode}`
                : "Address details are unavailable"
              : store?.name}
          </Text>
          {order.fulfilment === "delivery" && order.deliveryInstructions ? (
            <View style={styles.instructionBadge}>
              <ShieldCheck size={14} color={colors.primary} />
              <Text style={styles.instructionBadgeText}>
                {deliveryInstructionOptions.find((i) => i.id === order.deliveryInstructions)?.label}
              </Text>
            </View>
          ) : null}
        </Section>

        {/* Order Items & Price Summary */}
        <Section title="Items">
          <View style={styles.itemsList}>
            {order.lines
              ? order.lines.map((line, index) => (
                  <View key={`${line.name}-${index}`} style={styles.itemRow}>
                    <Text style={styles.itemNameText}>
                      {line.quantity} × {line.name}{" "}
                      <Text style={styles.itemUnitText}>{line.unit}</Text>
                    </Text>
                    <Text style={styles.itemPriceText}>
                      {formatMoney(line.price * line.quantity)}
                    </Text>
                  </View>
                ))
              : order.items.map((line) => {
                  const product = getProduct(line.productId);
                  return (
                    <View key={line.productId} style={styles.itemRow}>
                      <Text style={styles.itemNameText}>
                        {line.quantity} × {product?.name ?? "Item"}
                      </Text>
                      <Text style={styles.itemPriceText}>
                        {formatMoney((product?.price ?? 0) * line.quantity)}
                      </Text>
                    </View>
                  );
                })}

            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>
                {order.payment?.status === "PAID" ? "Total paid" : "Total to pay"}
              </Text>
              <Text style={styles.totalRowValue}>{formatMoney(order.total)}</Text>
            </View>

            {order.payment ? (
              <Text style={styles.paymentNote}>
                {order.payment.method === "COD"
                  ? order.payment.status === "PAID"
                    ? "Cash on delivery · collected"
                    : `Cash on delivery · keep ${formatMoney(order.total)} ready`
                  : "Online payment"}
                {order.payment.paymentId
                  ? ""
                  : " · payment record syncs when the backend is connected"}
              </Text>
            ) : null}
          </View>
        </Section>

        {/* Store Feedback Section */}
        {store ? (
          <StoreFeedbackCard orderId={order.id} storeName={store.name} />
        ) : null}

        {/* Cancel Order Action */}
        {pending ? (
          <View style={styles.cancelWrap}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
            >
              <Text style={styles.cancelBtnText}>Cancel order</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ReplacementBanner({
  orderId,
  replacement,
}: {
  orderId: string;
  replacement: OrderItemReplacement;
}) {
  const respondToReplacement = useAppStore((state) => state.respondToReplacement);
  const original = getProduct(replacement.originalProductId);
  const suggested = getProduct(replacement.replacementProductId);
  const line = `${replacement.quantity}× ${original?.name ?? "item"} (${original?.unit ?? ""})`;
  const suggestedLine = `${replacement.quantity}× ${suggested?.name ?? "item"} (${suggested?.unit ?? ""})`;

  if (replacement.status === "ACCEPTED" || replacement.status === "REJECTED") {
    return (
      <View style={styles.resolvedBanner}>
        <Text style={styles.resolvedBannerText}>
          {replacement.status === "ACCEPTED"
            ? `Replacement accepted · ${suggestedLine}`
            : `Replacement declined · ${line} refunded`}
        </Text>
      </View>
    );
  }

  if (replacement.status !== "PENDING") return null;

  return (
    <View style={styles.replacementCard}>
      <View style={styles.replacementHeader}>
        <View style={styles.replacementIconCircle}>
          <PackageSearch size={16} color={colors.offerForeground} />
        </View>
        <Text style={styles.replacementTitle}>Item substitution proposed</Text>
      </View>

      <Text style={styles.replacementReason}>
        Store suggested an alternative: {replacement.merchantReason.toLowerCase()}.
      </Text>

      <View style={styles.replacementBox}>
        <Text style={styles.strikeLine}>{line}</Text>
        <Text style={styles.newLine}>
          → {suggestedLine} · {formatMoney(replacement.replacementPriceSnapshot * replacement.quantity)}
        </Text>
      </View>

      <View style={styles.replacementBtns}>
        <Pressable
          onPress={() => {
            respondToReplacement(orderId, replacement.id, true);
            Toast.show({ type: "success", text1: "Replacement accepted" });
          }}
          style={({ pressed }) => [styles.acceptBtn, pressed && styles.pressed]}
        >
          <Text style={styles.acceptBtnText}>Accept replacement</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            respondToReplacement(orderId, replacement.id, false);
            Toast.show({ type: "success", text1: "Item declined · refund requested" });
          }}
          style={({ pressed }) => [styles.declineBtn, pressed && styles.pressed]}
        >
          <Text style={styles.declineBtnText}>Decline &amp; refund</Text>
        </Pressable>
      </View>
      <Text style={styles.replacementFooterNote}>
        Your total updates once you respond. Refunds are processed by the store.
      </Text>
    </View>
  );
}

const feedbackTagOptions = [
  "Quick delivery",
  "Fresh items",
  "Good packaging",
  "Polite staff",
  "Late delivery",
  "Missing items",
];

function StoreFeedbackCard({
  orderId,
  storeName,
}: {
  orderId: string;
  storeName?: string;
}) {
  const saved = useAppStore((state) => state.storeFeedback[orderId]);
  const submitStoreFeedback = useAppStore((state) => state.submitStoreFeedback);
  const addOrderNote = useAppStore((state) => state.addOrderNote);

  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  if (saved) {
    return (
      <Section title="Your store feedback">
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              size={20}
              color={value <= saved.rating ? colors.offer : colors.border}
              fill={value <= saved.rating ? colors.offer : "transparent"}
            />
          ))}
        </View>
        {saved.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {saved.tags.map((tag) => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {saved.comment ? (
          <Text style={styles.savedComment}>&quot;{saved.comment}&quot;</Text>
        ) : null}
        <Text style={styles.feedbackSuccessText}>
          Thanks for rating {storeName ?? "the store"}!
        </Text>
      </Section>
    );
  }

  return (
    <Section title={`Rate ${storeName ?? "the store"}`}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            onPress={() => setRating(value)}
            hitSlop={6}
            style={styles.starPressable}
          >
            <Star
              size={28}
              color={value <= rating ? colors.offer : colors.border}
              fill={value <= rating ? colors.offer : "transparent"}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.tagsRow}>
        {feedbackTagOptions.map((tag) => {
          const active = tags.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() =>
                setTags((cur) =>
                  active ? cur.filter((t) => t !== tag) : [...cur, tag]
                )
              }
              style={({ pressed }) => [
                styles.tagChip,
                active ? styles.tagChipActive : styles.tagChipInactive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.tagChipText,
                  active ? styles.tagChipTextActive : styles.tagChipTextInactive,
                ]}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={styles.commentInput}
        placeholder="Anything to add? (optional)"
        placeholderTextColor={colors.mutedForeground}
        value={comment}
        onChangeText={setComment}
      />

      <Pressable
        onPress={() => {
          const note = comment.trim();
          submitStoreFeedback(orderId, rating, tags, note);
          if (note) addOrderNote(orderId, note);
          Toast.show({ type: "success", text1: "Thanks for your feedback!" });
        }}
        disabled={rating === 0}
        style={({ pressed }) => [
          styles.submitFeedbackBtn,
          rating === 0 && styles.disabledFeedbackBtn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.submitFeedbackText}>Submit feedback</Text>
      </Pressable>

      <Text style={styles.feedbackDisclaimer}>
        Your note is attached to this order as a customer note when the server is connected. Star
        ratings stay on this device until a store reviews service exists.
      </Text>
    </Section>
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
    paddingBottom: 40,
  },
  statusHero: {
    padding: spacing.xl,
    alignItems: "center",
  },
  statusHeroPlaced: {
    backgroundColor: colors.freshSoft,
  },
  statusHeroCancelled: {
    backgroundColor: "rgba(212, 52, 31, 0.1)",
  },
  statusIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconPlaced: {
    backgroundColor: colors.primary,
  },
  statusIconCancelled: {
    backgroundColor: colors.destructive,
  },
  statusHeroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.foreground,
    marginTop: spacing.md,
  },
  statusHeroStore: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  callStoreWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  callStoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  callStoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  pinCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius["2xl"],
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(58, 143, 82, 0.4)",
    backgroundColor: colors.freshSoft,
    padding: spacing.lg,
    alignItems: "center",
  },
  pinEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.mutedForeground,
  },
  pinCode: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 8,
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  pinNote: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 18,
  },
  addressLine: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
  },
  instructionBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: 6,
    marginTop: spacing.md,
  },
  instructionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.foreground,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  itemNameText: {
    fontSize: 14,
    color: colors.foreground,
    flex: 1,
  },
  itemUnitText: {
    color: colors.mutedForeground,
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  totalRowLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
  },
  totalRowValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },
  paymentNote: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  cancelWrap: {
    padding: spacing.lg,
  },
  cancelBtn: {
    height: 46,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: colors.destructive,
    fontSize: 14,
    fontWeight: "700",
  },
  // Replacement Banner
  replacementCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius["2xl"],
    borderWidth: 2,
    borderColor: "rgba(221, 110, 28, 0.5)",
    backgroundColor: colors.offerSoft,
    padding: spacing.lg,
  },
  replacementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  replacementIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.offer,
    alignItems: "center",
    justifyContent: "center",
  },
  replacementTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.foreground,
  },
  replacementReason: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  replacementBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: 4,
  },
  strikeLine: {
    fontSize: 12,
    color: colors.mutedForeground,
    textDecorationLine: "line-through",
  },
  newLine: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
  },
  replacementBtns: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  acceptBtn: {
    flex: 1,
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtnText: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: "700",
  },
  declineBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtnText: {
    color: colors.destructive,
    fontSize: 13,
    fontWeight: "700",
  },
  replacementFooterNote: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
  },
  resolvedBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted,
  },
  resolvedBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedForeground,
  },
  // Feedback
  starsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  starPressable: {
    padding: 2,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tagChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.freshSoft,
  },
  tagChipInactive: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tagChipTextActive: {
    color: colors.primary,
  },
  tagChipTextInactive: {
    color: colors.mutedForeground,
  },
  commentInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.card,
    marginTop: spacing.md,
  },
  submitFeedbackBtn: {
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  disabledFeedbackBtn: {
    opacity: 0.5,
  },
  submitFeedbackText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  feedbackDisclaimer: {
    fontSize: 11,
    color: colors.mutedForeground,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
  tagBadge: {
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  tagBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.foreground,
  },
  savedComment: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontStyle: "italic",
    marginTop: spacing.sm,
  },
  feedbackSuccessText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
});

import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import {
  Bell,
  DoorOpen,
  MapPin,
  Phone,
  ShieldCheck,
  Store as StoreIcon,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { colors, radius, shadows, spacing } from "../theme";
import {
  CardPaymentForm,
  CartTotals,
  Choice,
  GatewayModal,
  LocationPicker,
  OptionPickerForm,
  ScreenHeader,
  Section,
  UpiPaymentForm,
  paymentIcons,
} from "../components";
import { netBankingBanks, paymentMethods, walletOptions } from "../data";
import { formatMoney } from "../model";
import { useAppStore, useSelectedAddress } from "../store";
import { findStockIssues, summariseCart } from "../totals";
import { CartScreen, StockIssueNotice } from "./CartScreen";

export const deliveryInstructionOptions: {
  id: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "ring", label: "Ring the bell", icon: Bell },
  { id: "door", label: "Leave at the door", icon: DoorOpen },
  { id: "call", label: "Call on arrival", icon: Phone },
  { id: "security", label: "Leave with security guard", icon: ShieldCheck },
];

export function CheckoutScreen() {
  const router = useRouter();
  const cart = useAppStore((state) => state.cart);
  const storeId = useAppStore((state) => state.cartStoreId);
  const placeOrder = useAppStore((state) => state.placeOrder);

  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState("cod");
  const [instruction, setInstruction] = useState("");
  const [gatewayOpen, setGatewayOpen] = useState(false);

  const address = useSelectedAddress();

  if (!cart.length || !storeId) return <CartScreen />;

  const total = summariseCart(cart, storeId, fulfilment).total;
  const blocked = findStockIssues(cart).length > 0;
  const isOnline = payment !== "cod";

  const handlePlaceCodOrder = async () => {
    if (blocked) return;
    try {
      const id = await placeOrder(fulfilment, instruction || undefined);
      if (id) {
        router.replace({
          pathname: "/order/[orderId]",
          params: { orderId: id },
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to place order",
        text2: err?.message || "Could not complete order on server",
      });
    }
  };

  const currentMethodLabel =
    paymentMethods.find((m) => m.id === payment)?.label ?? "Online payment";

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <ScreenHeader title="Checkout" backTo="/cart" />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <StockIssueNotice style={styles.stockNoticeMargin} />

        {/* Delivery Method */}
        <Section title="Delivery method">
          <Choice
            value="delivery"
            selectedValue={fulfilment}
            onSelect={(val) => setFulfilment(val as any)}
            label="Delivery"
            detail="Brought to your address"
            icon={MapPin}
          />
          <Choice
            value="pickup"
            selectedValue={fulfilment}
            onSelect={(val) => setFulfilment(val as any)}
            label="Pickup"
            detail="Collect from the store"
            icon={StoreIcon}
          />
        </Section>

        {/* Deliver to address & instructions */}
        {fulfilment === "delivery" ? (
          <>
            <Section title="Deliver to">
              <View style={styles.addressBox}>
                <MapPin size={20} color={colors.primary} style={styles.addressPin} />
                <View style={styles.addressTextWrap}>
                  <Text style={styles.addressLabel}>{address?.label ?? "No saved address"}</Text>
                  <Text style={styles.addressFull}>
                    {address
                      ? `${address.line1}, ${address.line2}, ${address.city}, ${address.state} ${address.pincode}`
                      : "Add an address before placing your order."}
                  </Text>
                </View>
              </View>
              <View style={styles.pickerMargin}>
                <LocationPicker variant="inline" />
              </View>
            </Section>

            <Section title="Delivery instructions">
              <View style={styles.instructionsGrid}>
                {deliveryInstructionOptions.map(({ id, label, icon: Icon }) => {
                  const selected = instruction === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setInstruction(selected ? "" : id)}
                      style={({ pressed }) => [
                        styles.instructionChip,
                        selected && styles.instructionChipSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Icon
                        size={14}
                        color={selected ? colors.freshText : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.instructionText,
                          selected && styles.instructionTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>
          </>
        ) : null}

        {/* Payment Method */}
        <Section title="Payment method">
          {paymentMethods.map((method) => {
            const Icon = paymentIcons[method.id] ?? Wallet;
            return (
              <Choice
                key={method.id}
                value={method.id}
                selectedValue={payment}
                onSelect={setPayment}
                label={method.label}
                detail={method.detail}
                icon={Icon}
              />
            );
          })}

          {payment === "upi" ? <UpiPaymentForm /> : null}
          {payment === "card" ? <CardPaymentForm /> : null}
          {payment === "netbanking" ? (
            <OptionPickerForm options={netBankingBanks} label="Choose your bank" />
          ) : null}
          {payment === "wallet" ? (
            <OptionPickerForm options={walletOptions} label="Choose a wallet" />
          ) : null}

          <View style={styles.shieldNote}>
            <ShieldCheck size={16} color={colors.primary} />
            <Text style={styles.shieldNoteText}>
              Online payments open a secure gateway. The gateway is connected later — this is the
              checkout preview.
            </Text>
          </View>
        </Section>

        {/* Payment Summary */}
        <Section title="Payment summary">
          <CartTotals fulfilment={fulfilment} />
        </Section>
      </ScrollView>

      {/* Sticky Bottom Order Button */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
        {isOnline ? (
          <Pressable
            onPress={() => !blocked && setGatewayOpen(true)}
            disabled={blocked}
            style={({ pressed }) => [
              styles.primaryBtn,
              blocked && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              Pay {formatMoney(total)} · {currentMethodLabel}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handlePlaceCodOrder}
            disabled={blocked}
            style={({ pressed }) => [
              styles.primaryBtn,
              blocked && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              Place order · Cash on delivery
              {blocked ? "" : ` · ${formatMoney(total)}`}
            </Text>
          </Pressable>
        )}
      </SafeAreaView>

      <GatewayModal
        open={gatewayOpen}
        onClose={() => setGatewayOpen(false)}
        amount={total}
        methodLabel={currentMethodLabel}
        onPayCash={() => {
          setPayment("cod");
          handlePlaceCodOrder();
        }}
      />
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
    paddingBottom: 24,
  },
  stockNoticeMargin: {
    margin: spacing.lg,
  },
  addressBox: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  addressPin: {
    marginTop: 2,
  },
  addressTextWrap: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
  },
  addressFull: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginTop: 2,
  },
  pickerMargin: {
    marginTop: spacing.md,
  },
  instructionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  instructionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  instructionChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.freshSoft,
  },
  instructionText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedForeground,
  },
  instructionTextSelected: {
    color: colors.freshText,
  },
  shieldNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  shieldNoteText: {
    flex: 1,
    fontSize: 11,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  bottomBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    ...shadows.elevated,
  },
  primaryBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryForeground,
  },
  pressed: {
    opacity: 0.8,
  },
});

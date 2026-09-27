import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import {
  Check,
  ChevronRight,
  CreditCard,
  Landmark,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { colors, radius, spacing } from "../theme";
import { paymentMethods, upiApps } from "../data";
import { formatMoney } from "../model";

export const paymentIcons: Record<string, LucideIcon> = {
  cod: Wallet,
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
  wallet: Wallet,
};

export function UpiPaymentForm() {
  const [app, setApp] = useState(upiApps[0]);
  const [upiId, setUpiId] = useState("");

  return (
    <View style={styles.formBox}>
      <Text style={styles.formBoxTitle}>Pay with UPI app</Text>
      <View style={styles.chipsRow}>
        {upiApps.map((name) => {
          const isSelected = app === name;
          return (
            <Pressable
              key={name}
              onPress={() => setApp(name)}
              style={({ pressed }) => [
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Or enter your UPI ID</Text>
      <TextInput
        style={styles.textInput}
        placeholder="name@okbank"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        value={upiId}
        onChangeText={setUpiId}
      />
    </View>
  );
}

export function CardPaymentForm() {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");

  return (
    <View style={styles.formBox}>
      <Text style={styles.fieldLabel}>Card number</Text>
      <TextInput
        style={styles.textInput}
        placeholder="1234 5678 9012 3456"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="numeric"
        maxLength={19}
        value={cardNumber}
        onChangeText={setCardNumber}
      />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Expiry</Text>
          <TextInput
            style={styles.textInput}
            placeholder="MM / YY"
            placeholderTextColor={colors.mutedForeground}
            maxLength={7}
            value={expiry}
            onChangeText={setExpiry}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>CVV</Text>
          <TextInput
            style={styles.textInput}
            placeholder="•••"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            value={cvv}
            onChangeText={setCvv}
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>Name on card</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Full name"
        placeholderTextColor={colors.mutedForeground}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.securityNote}>
        <ShieldCheck size={16} color={colors.primary} />
        <Text style={styles.securityNoteText}>
          Card details are encrypted by the payment gateway.
        </Text>
      </View>
    </View>
  );
}

export function OptionPickerForm({
  options,
  label,
}: {
  options: string[];
  label: string;
}) {
  const [picked, setPicked] = useState(options[0]);

  return (
    <View style={styles.formBox}>
      <Text style={styles.formBoxTitle}>{label}</Text>
      <View style={styles.optionsList}>
        {options.map((name) => {
          const isSelected = picked === name;
          return (
            <Pressable
              key={name}
              onPress={() => setPicked(name)}
              style={({ pressed }) => [
                styles.optionRow,
                isSelected && styles.optionRowSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {name}
              </Text>
              {isSelected && <Check size={16} color={colors.freshText} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function GatewayModal({
  open,
  onClose,
  amount,
  methodLabel,
  onPayCash,
}: {
  open: boolean;
  onClose: () => void;
  amount: number;
  methodLabel: string;
  onPayCash: () => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Payment gateway coming soon</Text>
          <View style={styles.gatewayNotice}>
            <ShieldCheck size={28} color={colors.primary} />
            <Text style={styles.gatewayNoticeText}>
              A secure payment page will open to complete your {formatMoney(amount)} payment via{" "}
              {methodLabel}. The gateway is coming in an update — online payments are simulated for
              now.
            </Text>
          </View>

          <Pressable
            onPress={() => {
              onClose();
              onPayCash();
            }}
            style={({ pressed }) => [styles.payCashBtn, pressed && styles.pressed]}
          >
            <Text style={styles.payCashBtnText}>Pay with cash on delivery instead</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.dismissBtn}>
            <Text style={styles.dismissBtnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function PaymentMethodsRow() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}
      >
        <View style={styles.accountIconBox}>
          <CreditCard size={20} color={colors.primary} />
        </View>
        <View style={styles.accountTextWrap}>
          <Text style={styles.accountTitle}>Payment methods</Text>
          <Text style={styles.accountSubtitle}>Cash now, online gateway later</Text>
        </View>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Payment methods</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <X size={20} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetScroll}>
              {paymentMethods.map((method) => {
                const Icon = paymentIcons[method.id] ?? Wallet;
                return (
                  <View
                    key={method.id}
                    style={[styles.methodCard, !method.available && styles.methodUnavailable]}
                  >
                    <View style={styles.methodIconBox}>
                      <Icon size={20} color={colors.primary} />
                    </View>
                    <View style={styles.methodContent}>
                      <Text style={styles.methodLabel}>{method.label}</Text>
                      <Text style={styles.methodDetail}>{method.detail}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        method.available ? styles.statusBadgeActive : styles.statusBadgeLater,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          method.available ? styles.statusTextActive : styles.statusTextLater,
                        ]}
                      >
                        {method.available ? "Active" : "Later"}
                      </Text>
                    </View>
                  </View>
                );
              })}
              <Text style={styles.methodsFooterNote}>
                Online payment options are configured for the app and will activate once the payment
                gateway webhook is live.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  formBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(242, 239, 233, 0.4)",
    gap: spacing.sm,
  },
  formBoxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedForeground,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.freshSoft,
  },
  chipUnselected: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: colors.freshText,
  },
  chipTextUnselected: {
    color: colors.mutedForeground,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.foreground,
    marginTop: 4,
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginTop: 4,
  },
  securityNoteText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  optionsList: {
    gap: spacing.xs,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.freshSoft,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  optionTextSelected: {
    color: colors.freshText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius["2xl"],
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
    textAlign: "center",
  },
  gatewayNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    gap: spacing.md,
  },
  gatewayNoticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  payCashBtn: {
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  payCashBtnText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  dismissBtn: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissBtnText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: "600",
  },
  // Sheet
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  accountIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  accountTextWrap: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  accountSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    maxHeight: "80%",
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },
  sheetScroll: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.md,
  },
  methodUnavailable: {
    opacity: 0.6,
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  methodContent: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  methodDetail: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeActive: {
    backgroundColor: colors.freshSoft,
  },
  statusBadgeLater: {
    backgroundColor: colors.muted,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  statusTextActive: {
    color: colors.freshText,
  },
  statusTextLater: {
    color: colors.mutedForeground,
  },
  methodsFooterNote: {
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});

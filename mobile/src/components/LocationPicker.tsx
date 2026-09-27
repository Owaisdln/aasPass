import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { ChevronDown, ChevronRight, MapPin, Plus, Trash2, X } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, radius, spacing } from "../theme";
import { useAppStore, useSelectedAddress } from "../store";

const emptyAddress = {
  label: "",
  receiverName: "",
  receiverPhone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
};

export function LocationPicker({
  variant = "header",
}: {
  variant?: "header" | "inline" | "account";
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyAddress);

  const address = useSelectedAddress();
  const addresses = useAppStore((state) => state.addresses);
  const setAddressId = useAppStore((state) => state.setAddressId);
  const addAddress = useAppStore((state) => state.addAddress);
  const deleteAddress = useAppStore((state) => state.deleteAddress);

  const valid =
    form.label.trim() &&
    form.receiverName.trim() &&
    form.receiverPhone.trim().length >= 7 &&
    form.receiverPhone.trim().length <= 15 &&
    form.line1.trim() &&
    form.line2.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.country.trim() &&
    /^\d{4,10}$/.test(form.pincode.trim());

  const handleSave = async () => {
    if (!valid) {
      Toast.show({
        type: "error",
        text1: "Complete the required fields and enter a valid pincode",
      });
      return;
    }

    try {
      await addAddress({
        label: form.label.trim(),
        receiverName: form.receiverName.trim(),
        receiverPhone: form.receiverPhone.trim(),
        line1: form.line1.trim(),
        line2: [
          form.line2.trim(),
          form.landmark.trim() ? `near ${form.landmark.trim()}` : "",
        ]
          .filter(Boolean)
          .join(", "),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        pincode: form.pincode.trim(),
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Address could not be saved",
        text2: error instanceof Error ? error.message : "Please try again.",
      });
      return;
    }

    setForm(emptyAddress);
    setAdding(false);
    Toast.show({
      type: "success",
      text1: "Address added",
    });
  };

  const handleDelete = (id: string, label: string) => {
    if (addresses.length <= 1) {
      Toast.show({
        type: "error",
        text1: "You must keep at least one saved address",
      });
      return;
    }

    Alert.alert(
      "Delete address?",
      `Are you sure you want to remove "${label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteAddress(id);
            Toast.show({ type: "success", text1: "Address removed" });
          },
        },
      ]
    );
  };

  const renderTrigger = () => {
    if (variant === "header") {
      return (
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.headerTrigger, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Delivering to ${address?.label ?? "no saved address"}`}
        >
          <MapPin size={18} color={colors.primaryForeground} />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerSubtitle}>Delivering to</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {address ? `${address.label} · ${address.line2.split(", ").pop() ?? address.city}` : "Add an address"}
            </Text>
          </View>
          <ChevronDown size={16} color={colors.primaryForeground} />
        </Pressable>
      );
    }

    if (variant === "account") {
      return (
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.accountTrigger, pressed && styles.pressed]}
        >
          <View style={styles.accountIconBox}>
            <MapPin size={20} color={colors.primary} />
          </View>
          <View style={styles.accountTextWrap}>
            <Text style={styles.accountTitle}>Saved delivery addresses</Text>
            <Text style={styles.accountSubtitle}>
              {addresses.length} saved · Default: {address?.label ?? "None saved"}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Pressable>
      );
    }

    // inline
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.inlineTrigger, pressed && styles.pressed]}
      >
        <MapPin size={18} color={colors.primary} />
        <View style={styles.inlineTextWrap}>
          <Text style={styles.inlineTitle}>{address?.label ?? "Add a delivery address"}</Text>
          <Text style={styles.inlineSubtitle} numberOfLines={1}>
            {address ? `${address.line1}, ${address.line2}` : "No saved address"}
          </Text>
        </View>
        <Text style={styles.changeLink}>Change</Text>
      </Pressable>
    );
  };

  return (
    <>
      {renderTrigger()}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {adding ? "Add new address" : "Select delivery address"}
              </Text>
              <Pressable
                onPress={() => {
                  setAdding(false);
                  setOpen(false);
                }}
                hitSlop={10}
              >
                <X size={20} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.sheetScroll}
              keyboardShouldPersistTaps="handled"
            >
              {adding ? (
                <View style={styles.formContainer}>
                  <Text style={styles.fieldLabel}>Address label</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Home, Work, Parents"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.label}
                    onChangeText={(val) => setForm((f) => ({ ...f, label: val }))}
                  />

                  <Text style={styles.fieldLabel}>Recipient name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.receiverName}
                    onChangeText={(val) => setForm((f) => ({ ...f, receiverName: val }))}
                  />

                  <Text style={styles.fieldLabel}>Recipient phone</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="phone-pad"
                    value={form.receiverPhone}
                    onChangeText={(val) => setForm((f) => ({ ...f, receiverPhone: val }))}
                  />

                  <Text style={styles.fieldLabel}>Flat, House no., Building</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Flat 402, Lake View Apts"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.line1}
                    onChangeText={(val) => setForm((f) => ({ ...f, line1: val }))}
                  />

                  <Text style={styles.fieldLabel}>Street, Area</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 12th Main, Indiranagar"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.line2}
                    onChangeText={(val) => setForm((f) => ({ ...f, line2: val }))}
                  />

                  <Text style={styles.fieldLabel}>Landmark (optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Near Metro Station"
                    placeholderTextColor={colors.mutedForeground}
                    value={form.landmark}
                    onChangeText={(val) => setForm((f) => ({ ...f, landmark: val }))}
                  />

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>City</Text>
                      <TextInput
                        style={styles.textInput}
                        value={form.city}
                        onChangeText={(val) => setForm((f) => ({ ...f, city: val }))}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.fieldLabel}>Pincode</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        maxLength={10}
                        placeholder="Postal code"
                        placeholderTextColor={colors.mutedForeground}
                        value={form.pincode}
                        onChangeText={(val) =>
                          setForm((f) => ({ ...f, pincode: val.replace(/[^\da-z]/gi, "") }))
                        }
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>State / Province</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.state}
                    onChangeText={(val) => setForm((f) => ({ ...f, state: val }))}
                  />

                  <Text style={styles.fieldLabel}>Country</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.country}
                    onChangeText={(val) => setForm((f) => ({ ...f, country: val }))}
                  />

                  <View style={styles.formActions}>
                    <Pressable
                      onPress={handleSave}
                      style={({ pressed }) => [
                        styles.primaryActionBtn,
                        !valid && styles.disabledBtn,
                        pressed && styles.pressed,
                      ]}
                      disabled={!valid}
                    >
                      <Text style={styles.primaryActionText}>Save Address</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setAdding(false)}
                      style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.addressList}>
                  {addresses.map((item) => {
                    const isSelected = item.id === address?.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setAddressId(item.id);
                          setOpen(false);
                          Toast.show({
                            type: "success",
                            text1: `Delivering to ${item.label}`,
                          });
                        }}
                        style={({ pressed }) => [
                          styles.addressCard,
                          isSelected && styles.addressCardSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <View style={styles.addressCardContent}>
                          <Text style={styles.addressLabel}>{item.label}</Text>
                          <Text style={styles.addressDetail}>
                            {item.line1}, {item.line2}, {item.city} - {item.pincode}
                          </Text>
                        </View>
                        {addresses.length > 1 && (
                          <Pressable
                            onPress={() => handleDelete(item.id, item.label)}
                            style={styles.deleteIconBtn}
                            hitSlop={10}
                          >
                            <Trash2 size={16} color={colors.destructive} />
                          </Pressable>
                        )}
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={() => setAdding(true)}
                    style={({ pressed }) => [styles.addAddressBtn, pressed && styles.pressed]}
                  >
                    <Plus size={18} color={colors.primary} />
                    <Text style={styles.addAddressText}>Add new address</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "75%",
    gap: 6,
  },
  headerTextWrap: {
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.primaryForeground,
    opacity: 0.8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryForeground,
  },
  accountTrigger: {
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
  inlineTrigger: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  inlineTextWrap: {
    flex: 1,
  },
  inlineTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.foreground,
  },
  inlineSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    maxHeight: "85%",
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
  },
  addressList: {
    gap: spacing.sm,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.md,
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.freshSoft,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  addressCardContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  addressDetail: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
    lineHeight: 16,
  },
  deleteIconBtn: {
    padding: 6,
  },
  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  // Form styles
  formContainer: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  formCol: {
    flex: 1,
  },
  formActions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  primaryActionBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: colors.primaryForeground,
    fontSize: 15,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  cancelBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
});

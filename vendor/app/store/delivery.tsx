import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as api from "../../src/features/vendor/api/vendor";
import type { UpdateDeliverySettingsInput } from "../../src/features/vendor/model";
import {
  ActionButton,
  Card,
  ErrorNote,
  Field,
  Loading,
  palette,
  Screen,
  Section,
  TopBar,
  useVendorMutation,
} from "../../src/native/ui";

type FormState = {
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  minimumOrderAmount: string;
  deliveryRadiusKm: string;
  deliveryCharge: string;
  freeDeliveryAbove: string;
  estimatedDeliveryTime: string;
};

export default function DeliveryScreen() {
  const settings = useQuery({ queryKey: ["vendor", "delivery"], queryFn: api.getDelivery });
  const [form, setForm] = useState<FormState | null>(null);
  const save = useVendorMutation(
    (input: UpdateDeliverySettingsInput) => api.updateDelivery(input),
    "Delivery settings saved",
  );

  useEffect(() => {
    if (!settings.data) return;
    setForm({
      isDeliveryAvailable: settings.data.isDeliveryAvailable,
      isPickupAvailable: settings.data.isPickupAvailable,
      minimumOrderAmount: String(settings.data.minimumOrderAmount),
      deliveryRadiusKm: String(settings.data.deliveryRadiusKm),
      deliveryCharge: String(settings.data.deliveryCharge),
      freeDeliveryAbove:
        settings.data.freeDeliveryAbove == null ? "" : String(settings.data.freeDeliveryAbove),
      estimatedDeliveryTime: String(settings.data.estimatedDeliveryTime),
    });
  }, [settings.data]);

  if (settings.isLoading || !form) {
    if (settings.error)
      return (
        <>
          <TopBar title="Delivery & pickup" back />
          <ErrorNote message={settings.error.message} />
        </>
      );
    return (
      <>
        <TopBar title="Delivery & pickup" back />
        <Loading />
      </>
    );
  }

  const toggle = (key: "isDeliveryAvailable" | "isPickupAvailable") => {
    setForm((current) => (current ? { ...current, [key]: !current[key] } : current));
  };
  const numericField = (
    key: keyof Omit<FormState, "isDeliveryAvailable" | "isPickupAvailable">,
    label: string,
  ) => (
    <Field
      label={label}
      value={form[key]}
      onChangeText={(value) =>
        setForm((current) =>
          current ? { ...current, [key]: value.replace(/[^\d.]/g, "") } : current,
        )
      }
      keyboardType="decimal-pad"
    />
  );
  const noneAvailable = !form.isDeliveryAvailable && !form.isPickupAvailable;
  const submit = () => {
    save.mutate({
      isDeliveryAvailable: form.isDeliveryAvailable,
      isPickupAvailable: form.isPickupAvailable,
      minimumOrderAmount: Number(form.minimumOrderAmount) || 0,
      deliveryRadiusKm: Number(form.deliveryRadiusKm) || 0,
      deliveryCharge: Number(form.deliveryCharge) || 0,
      estimatedDeliveryTime: Number(form.estimatedDeliveryTime) || 0,
      ...(form.freeDeliveryAbove ? { freeDeliveryAbove: Number(form.freeDeliveryAbove) } : {}),
    });
  };

  return (
    <Screen>
      <TopBar title="Delivery & pickup" back />
      <Section>
        <Card style={{ padding: 0 }}>
          <ToggleRow
            title="Home delivery"
            value={form.isDeliveryAvailable}
            onPress={() => toggle("isDeliveryAvailable")}
          />
          <ToggleRow
            title="Store pickup"
            value={form.isPickupAvailable}
            onPress={() => toggle("isPickupAvailable")}
          />
        </Card>
        {noneAvailable ? (
          <Text style={{ marginTop: 9, color: palette.danger, fontSize: 12, fontWeight: "700" }}>
            Enable delivery or pickup so customers can place orders.
          </Text>
        ) : null}
      </Section>
      <Section>
        {numericField("minimumOrderAmount", "Minimum order amount (₹)")}
        {form.isDeliveryAvailable ? (
          <>
            {numericField("deliveryRadiusKm", "Delivery radius (km)")}
            {numericField("deliveryCharge", "Delivery charge (₹)")}
            {numericField("freeDeliveryAbove", "Free delivery above (₹)")}
            {numericField("estimatedDeliveryTime", "Estimated delivery time (minutes)")}
          </>
        ) : null}
      </Section>
      <Section>
        <ActionButton
          title={save.isPending ? "Saving…" : "Save settings"}
          disabled={noneAvailable || save.isPending}
          onPress={submit}
        />
      </Section>
    </Screen>
  );
}

function ToggleRow({
  title,
  value,
  onPress,
}: {
  title: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderColor: palette.border,
      }}
    >
      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: "700" }}>{title}</Text>
      <View
        style={{
          width: 45,
          height: 27,
          justifyContent: "center",
          paddingHorizontal: 3,
          borderRadius: 20,
          backgroundColor: value ? palette.primary : "#D9E0DB",
        }}
      >
        <View
          style={{
            width: 21,
            height: 21,
            borderRadius: 12,
            backgroundColor: "#fff",
            alignSelf: value ? "flex-end" : "flex-start",
          }}
        />
      </View>
    </Pressable>
  );
}

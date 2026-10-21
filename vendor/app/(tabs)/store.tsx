import { useState } from "react";
import type { ReactNode } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ChevronRight, Clock3, LogOut, Settings2, Truck } from "lucide-react-native";
import { signOutRemote } from "../../src/features/vendor/api/auth";
import * as api from "../../src/features/vendor/api/vendor";
import type { CreateStoreInput, Store, UpdateStoreInput } from "../../src/features/vendor/model";
import { useSession } from "../../src/features/vendor/session";
import { formatINR } from "../../src/features/vendor/rules";
import {
  ActionButton,
  Card,
  ErrorNote,
  Field,
  Loading,
  palette,
  Screen,
  Section,
  Tag,
  TopBar,
  useVendorMutation,
} from "../../src/native/ui";

const fields: {
  key: keyof UpdateStoreInput;
  label: string;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
}[] = [
  { key: "name", label: "Store name" },
  { key: "phone", label: "Phone", keyboardType: "phone-pad" },
  { key: "email", label: "Email", keyboardType: "email-address" },
  { key: "addressLine1", label: "Address line 1" },
  { key: "addressLine2", label: "Address line 2" },
  { key: "city", label: "City" },
  { key: "pincode", label: "Pincode", keyboardType: "numeric" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "gstNumber", label: "GST number" },
  { key: "businessRegistrationNumber", label: "Registration number" },
];

type StoreFormValues = Partial<Record<keyof UpdateStoreInput | "latitude" | "longitude", string>>;

export default function StoreScreen() {
  const store = useQuery({ queryKey: ["vendor", "store"], queryFn: api.getMyStore });
  const delivery = useQuery({ queryKey: ["vendor", "delivery"], queryFn: api.getDelivery });
  const hours = useQuery({ queryKey: ["vendor", "hours"], queryFn: api.getHours });
  const session = useSession((state) => state.session);
  const signOut = useSession((state) => state.signOut);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<StoreFormValues>({});
  const save = useVendorMutation(
    (input: UpdateStoreInput) => api.updateStore(input),
    "Store profile updated",
  );

  if (store.isLoading)
    return (
      <>
        <TopBar title="My store" />
        <Loading />
      </>
    );
  if (store.error)
    return (
      <>
        <TopBar title="My store" />
        <ErrorNote message={store.error.message} />
      </>
    );

  const beginEdit = () => {
    const current = store.data;
    if (!current) return;
    const values: StoreFormValues = {};
    for (const field of fields) values[field.key] = String(current[field.key] ?? "");
    values.description = current.description ?? "";
    values.latitude = String(current.latitude);
    values.longitude = String(current.longitude);
    setForm(values);
    setEditing(true);
  };

  const submit = () => {
    if (
      !form.name?.trim() ||
      !form.phone?.trim() ||
      !form.addressLine1?.trim() ||
      !form.city?.trim() ||
      !form.pincode?.trim() ||
      !form.state?.trim() ||
      !form.country?.trim()
    ) {
      Alert.alert(
        "Required details missing",
        "Complete the store name, phone, address, city, pincode, state and country.",
      );
      return;
    }
    const input: UpdateStoreInput = {};
    for (const field of fields) {
      const value = form[field.key]?.trim();
      if (value) Object.assign(input, { [field.key]: value });
    }
    input.description = form.description?.trim() ?? "";
    input.latitude = Number(form.latitude) || 0;
    input.longitude = Number(form.longitude) || 0;
    save.mutate(input, { onSuccess: () => setEditing(false) });
  };

  const logout = () => {
    Alert.alert("Sign out?", "You'll need to sign in again to manage this store.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void signOutRemote().finally(() => {
            signOut();
            router.replace("/");
          });
        },
      },
    ]);
  };

  return (
    <Screen>
      <TopBar title="My store" subtitle={session?.email} />
      {store.data ? (
        <Section>
          <Card>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Text style={{ color: palette.ink, fontSize: 18, fontWeight: "900" }}>
                    {store.data.name}
                  </Text>
                  {store.data.verificationStatus === "VERIFIED" ? (
                    <BadgeCheck size={18} color={palette.primary} />
                  ) : null}
                </View>
                <Text style={{ marginTop: 4, color: palette.muted, fontSize: 12 }}>
                  {store.data.status === "ACTIVE"
                    ? "Live on aasPass"
                    : store.data.status.replaceAll("_", " ")}{" "}
                  · {store.data.isOpen ? "Open now" : "Closed now"}
                </Text>
              </View>
              <Pressable
                onPress={editing ? () => setEditing(false) : beginEdit}
                style={{ padding: 7 }}
              >
                <Text style={{ color: palette.primary, fontWeight: "800" }}>
                  {editing ? "Cancel" : "Edit"}
                </Text>
              </Pressable>
            </View>
            {editing ? (
              <View style={{ marginTop: 16 }}>
                {fields.map((field) => (
                  <Field
                    key={field.key}
                    label={field.label}
                    value={form[field.key] ?? ""}
                    keyboardType={field.keyboardType}
                    onChangeText={(value) => setForm({ ...form, [field.key]: value })}
                  />
                ))}
                <Field
                  label="About your store"
                  value={form.description ?? ""}
                  multiline
                  onChangeText={(value) => setForm({ ...form, description: value })}
                />
                <View style={{ flexDirection: "row", gap: 9 }}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Latitude"
                      value={form.latitude ?? ""}
                      keyboardType="decimal-pad"
                      onChangeText={(value) => setForm({ ...form, latitude: value })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Longitude"
                      value={form.longitude ?? ""}
                      keyboardType="decimal-pad"
                      onChangeText={(value) => setForm({ ...form, longitude: value })}
                    />
                  </View>
                </View>
                <ActionButton
                  title={save.isPending ? "Saving…" : "Save store details"}
                  disabled={save.isPending}
                  onPress={submit}
                />
              </View>
            ) : (
              <View style={{ gap: 6, marginTop: 14 }}>
                {store.data.description ? (
                  <Text style={{ color: palette.muted, fontSize: 13 }}>
                    {store.data.description}
                  </Text>
                ) : null}
                <Text style={{ color: palette.ink, fontSize: 13 }}>
                  {[
                    store.data.addressLine1,
                    store.data.addressLine2,
                    store.data.city,
                    store.data.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
                <Text style={{ color: palette.muted, fontSize: 12 }}>
                  {store.data.phone}
                  {store.data.email ? ` · ${store.data.email}` : ""}
                </Text>
                {store.data.gstNumber ? (
                  <Text style={{ color: palette.muted, fontSize: 12 }}>
                    GST {store.data.gstNumber}
                  </Text>
                ) : null}
              </View>
            )}
          </Card>
          {store.data.verificationStatus === "PENDING" ? (
            <Card style={{ marginTop: 10, backgroundColor: "#EDF5EF" }}>
              <Text style={{ color: palette.ink, fontSize: 12 }}>
                Your store is waiting for aasPass to verify it.
              </Text>
            </Card>
          ) : null}
        </Section>
      ) : (
        <CreateStoreForm />
      )}

      {store.data ? (
        <Section title="Running your store">
          <Card style={{ padding: 0 }}>
            <NavRow
              href="/store/hours"
              icon={<Clock3 size={18} color={palette.primary} />}
              title="Opening hours"
              hint={
                hours.data ? `${hours.data.filter((row) => !row.isClosed).length} days open` : ""
              }
            />
            <NavRow
              href="/store/delivery"
              icon={<Truck size={18} color={palette.primary} />}
              title="Delivery & pickup"
              hint={
                delivery.data
                  ? `${delivery.data.isDeliveryAvailable ? `${delivery.data.deliveryRadiusKm} km` : "No delivery"} · min ${formatINR(delivery.data.minimumOrderAmount)}`
                  : ""
              }
            />
            <NavRow
              href="/connect"
              icon={<Settings2 size={18} color={palette.primary} />}
              title="Connection"
              hint={session?.mode === "demo" ? "Sample store" : "Live server"}
            />
          </Card>
        </Section>
      ) : null}
      <Section>
        <ActionButton title="Sign out" secondary onPress={logout} />
      </Section>
    </Screen>
  );
}

function NavRow({
  href,
  icon,
  title,
  hint,
}: {
  href: "/store/hours" | "/store/delivery" | "/connect";
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={{
          minHeight: 64,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 13,
          gap: 12,
          borderBottomWidth: 1,
          borderColor: palette.border,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            backgroundColor: "#E8F4EC",
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.ink, fontSize: 14, fontWeight: "800" }}>{title}</Text>
          <Text style={{ marginTop: 2, color: palette.muted, fontSize: 11 }}>{hint}</Text>
        </View>
        <ChevronRight size={18} color={palette.muted} />
      </Pressable>
    </Link>
  );
}

function CreateStoreForm() {
  const create = useVendorMutation(
    (input: Parameters<typeof api.createStore>[0]) => api.createStore(input),
    "Store created",
  );
  const [values, setValues] = useState<StoreFormValues>({});
  const basicKeys: (keyof UpdateStoreInput)[] = [
    "name",
    "phone",
    "addressLine1",
    "city",
    "state",
    "country",
    "pincode",
  ];
  const basic = fields.filter((item) => basicKeys.includes(item.key));
  const submit = () => {
    const required: (keyof CreateStoreInput)[] = [
      "name",
      "phone",
      "addressLine1",
      "city",
      "state",
      "country",
      "pincode",
    ];
    if (required.some((key) => !values[key]?.trim())) {
      Alert.alert("Required details missing", "Complete all required store details.");
      return;
    }
    create.mutate({
      name: values.name!.trim(),
      phone: values.phone!.trim(),
      addressLine1: values.addressLine1!.trim(),
      city: values.city!.trim(),
      state: values.state!.trim(),
      country: values.country!.trim(),
      pincode: values.pincode!.trim(),
      latitude: Number(values.latitude) || 0,
      longitude: Number(values.longitude) || 0,
      ...(values.email ? { email: values.email.trim() } : {}),
      ...(values.description ? { description: values.description.trim() } : {}),
    });
  };
  return (
    <Section title="Create your store">
      <Card>
        {basic.map((item) => (
          <Field
            key={item.key}
            label={`${item.label} *`}
            value={values[item.key] ?? ""}
            keyboardType={item.keyboardType}
            onChangeText={(value) => setValues({ ...values, [item.key]: value })}
          />
        ))}
        <Field
          label="About your store"
          multiline
          value={values.description ?? ""}
          onChangeText={(value) => setValues({ ...values, description: value })}
        />
        <View style={{ flexDirection: "row", gap: 9 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Latitude"
              keyboardType="decimal-pad"
              value={values.latitude ?? ""}
              onChangeText={(value) => setValues({ ...values, latitude: value })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Longitude"
              keyboardType="decimal-pad"
              value={values.longitude ?? ""}
              onChangeText={(value) => setValues({ ...values, longitude: value })}
            />
          </View>
        </View>
        <ActionButton
          title={create.isPending ? "Creating…" : "Create store"}
          disabled={create.isPending}
          onPress={submit}
        />
      </Card>
    </Section>
  );
}

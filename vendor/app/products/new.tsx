import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as api from "../../src/features/vendor/api/vendor";
import type { AvailabilityStatus, MasterProduct } from "../../src/features/vendor/model";
import { discountPercent } from "../../src/features/vendor/rules";
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
import { router } from "expo-router";

export default function AddProductScreen() {
  const master = useQuery({
    queryKey: ["vendor", "master-products"],
    queryFn: api.getMasterProducts,
    staleTime: 300_000,
  });
  const categories = useQuery({
    queryKey: ["vendor", "categories"],
    queryFn: api.getCategories,
    staleTime: 300_000,
  });
  const products = useQuery({ queryKey: ["vendor", "products"], queryFn: api.getStoreProducts });
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<MasterProduct | null>(null);
  const [mrp, setMrp] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [availability, setAvailability] = useState<AvailabilityStatus>("AVAILABLE");
  const [trackInventory, setTrackInventory] = useState(true);
  const [featured, setFeatured] = useState(false);
  const create = useVendorMutation(async () => {
    if (!picked) throw new Error("Choose a catalogue product first.");
    const product = await api.createStoreProduct({
      masterProductId: picked.id,
      mrp: Number(mrp),
      sellingPrice: Number(price),
      availabilityStatus: availability,
      trackInventory,
      isFeatured: featured,
    });
    if (trackInventory)
      await api.createInventory({ storeProductId: product.id, stockQuantity: Number(stock) || 0 });
    return product;
  }, "Product added to your store");

  const alreadyListed = useMemo(
    () => new Set((products.data ?? []).map((product) => product.masterProductId)),
    [products.data],
  );
  const categoryNames = new Map(
    (categories.data ?? []).map((category) => [category.id, category.name]),
  );
  const options = (master.data ?? [])
    .filter((item) => item.status === "ACTIVE" && !alreadyListed.has(item.id))
    .filter(
      (item) => !search || `${item.name} ${item.sku}`.toLowerCase().includes(search.toLowerCase()),
    );
  const discount = discountPercent(Number(mrp), Number(price));
  const statuses: AvailabilityStatus[] = ["AVAILABLE", "OUT_OF_STOCK", "HIDDEN", "DISCONTINUED"];

  return (
    <Screen>
      <TopBar
        title={picked ? "Set your price" : "Add product"}
        subtitle={picked?.name ?? "Choose from the aasPass catalogue"}
        back
      />
      {master.isLoading ? (
        <Loading />
      ) : master.error ? (
        <ErrorNote message={master.error.message} />
      ) : picked ? (
        <>
          <Section>
            <Card style={{ marginBottom: 12, backgroundColor: "#EDF5EF" }}>
              <Text style={{ color: palette.ink, fontSize: 14, fontWeight: "800" }}>
                {picked.name}
              </Text>
              <Text style={{ marginTop: 4, color: palette.muted, fontSize: 12 }}>
                {picked.unitValue} · {picked.sku} · GST {picked.gstRate}%
              </Text>
              <Pressable onPress={() => setPicked(null)}>
                <Text
                  style={{ marginTop: 9, color: palette.primary, fontSize: 12, fontWeight: "800" }}
                >
                  Choose a different product
                </Text>
              </Pressable>
            </Card>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="MRP (₹)"
                  keyboardType="decimal-pad"
                  value={mrp}
                  onChangeText={setMrp}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Your price (₹)"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>
            {discount > 0 ? (
              <Text
                style={{
                  marginBottom: 12,
                  color: palette.primary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                Customers see {discount}% off
              </Text>
            ) : null}
            <Text style={styles.label}>Availability</Text>
            <View style={styles.wrap}>
              {statuses.map((status) => (
                <Pressable key={status} onPress={() => setAvailability(status)}>
                  <Tag
                    text={status.replaceAll("_", " ")}
                    tone={availability === status ? "green" : "neutral"}
                  />
                </Pressable>
              ))}
            </View>
            <Toggle
              title="Track stock"
              subtitle="Count units in and out"
              value={trackInventory}
              onPress={() => setTrackInventory((value) => !value)}
            />
            <Toggle
              title="Featured"
              subtitle="Show near the top of your store"
              value={featured}
              onPress={() => setFeatured((value) => !value)}
            />
            {trackInventory ? (
              <Field
                label="Opening stock (units)"
                keyboardType="numeric"
                value={stock}
                onChangeText={(value) => setStock(value.replace(/\D/g, ""))}
              />
            ) : null}
            <ActionButton
              title={create.isPending ? "Adding…" : "Add to my store"}
              disabled={create.isPending}
              onPress={() =>
                create.mutate(undefined, { onSuccess: () => router.replace("/(tabs)/products") })
              }
            />
          </Section>
        </>
      ) : (
        <Section>
          <Field
            label="Search catalogue"
            placeholder="Search name or code"
            value={search}
            onChangeText={setSearch}
          />
          {products.isLoading ? (
            <Loading />
          ) : products.error ? (
            <ErrorNote message={products.error.message} />
          ) : (
            <View style={{ gap: 8 }}>
              {options.map((item) => (
                <Pressable key={item.id} onPress={() => setPicked(item)}>
                  <Card
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: "800" }}>
                        {item.name}
                      </Text>
                      <Text style={{ marginTop: 3, color: palette.muted, fontSize: 11 }}>
                        {item.unitValue} · {categoryNames.get(item.categoryId) ?? "Catalogue"}
                      </Text>
                    </View>
                    <Text style={{ color: palette.primary, fontSize: 12, fontWeight: "800" }}>
                      Select
                    </Text>
                  </Card>
                </Pressable>
              ))}
              {!options.length ? (
                <Text style={{ padding: 20, color: palette.muted, textAlign: "center" }}>
                  Nothing left to add for this search.
                </Text>
              ) : null}
            </View>
          )}
        </Section>
      )}
    </Screen>
  );
}

function Toggle({
  title,
  subtitle,
  value,
  onPress,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 6,
        padding: 11,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: "#fff",
      }}
    >
      <View>
        <Text style={{ color: palette.ink, fontSize: 13, fontWeight: "800" }}>{title}</Text>
        <Text style={{ marginTop: 3, color: palette.muted, fontSize: 11 }}>{subtitle}</Text>
      </View>
      <Tag text={value ? "On" : "Off"} tone={value ? "green" : "neutral"} />
    </Pressable>
  );
}

const styles = {
  label: { marginBottom: 8, color: palette.ink, fontSize: 13, fontWeight: "800" as const },
  wrap: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 7, marginBottom: 10 },
};

import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as api from "../../src/features/vendor/api/vendor";
import type {
  AvailabilityStatus,
  Inventory,
  InventoryTransactionType,
  UpdateStoreProductInput,
} from "../../src/features/vendor/model";
import {
  applyStockChange,
  discountPercent,
  formatINR,
  isLowStock,
  STOCK_IN,
  STOCK_OUT,
} from "../../src/features/vendor/rules";
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
  timeAgo,
  TopBar,
  useVendorMutation,
} from "../../src/native/ui";

const txLabel: Record<InventoryTransactionType, string> = {
  PURCHASE: "Purchased",
  RESTOCK: "Restocked",
  RETURN: "Returned",
  SALE: "Sold",
  DAMAGE: "Damaged",
  EXPIRED: "Expired",
  ADJUSTMENT: "Adjusted",
};
const availabilityOptions: AvailabilityStatus[] = [
  "AVAILABLE",
  "OUT_OF_STOCK",
  "HIDDEN",
  "DISCONTINUED",
];

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const products = useQuery({ queryKey: ["vendor", "products"], queryFn: api.getStoreProducts });
  const master = useQuery({
    queryKey: ["vendor", "master-products"],
    queryFn: api.getMasterProducts,
  });
  const inventory = useQuery({ queryKey: ["vendor", "inventory"], queryFn: api.getInventory });

  if (products.isLoading || master.isLoading)
    return (
      <>
        <TopBar title="Product" back />
        <Loading />
      </>
    );
  if (products.error)
    return (
      <>
        <TopBar title="Product" back />
        <ErrorNote message={products.error.message} />
      </>
    );
  const product = products.data?.find((item) => item.id === productId);
  if (!product)
    return (
      <>
        <TopBar title="Product" back />
        <Section>
          <Text style={{ textAlign: "center", color: palette.muted }}>Product not found.</Text>
        </Section>
      </>
    );
  const masterProduct = master.data?.find((item) => item.id === product.masterProductId);
  const stock = inventory.data?.find((item) => item.storeProductId === product.id);

  return (
    <Screen>
      <TopBar
        title={masterProduct?.name ?? "Product"}
        subtitle={masterProduct ? `${masterProduct.unitValue} · ${masterProduct.sku}` : undefined}
        back
      />
      {product.trackInventory ? (
        <Section title="Stock">
          {stock ? (
            <StockManager key={`${stock.id}-${stock.version}`} inventory={stock} />
          ) : (
            <SetupStock productId={product.id} />
          )}
        </Section>
      ) : null}
      <ProductEditor
        key={product.updatedAt}
        productId={product.id}
        initial={{
          mrp: String(Number(product.mrp)),
          sellingPrice: String(Number(product.sellingPrice)),
          availabilityStatus: product.availabilityStatus,
          trackInventory: product.trackInventory,
          isFeatured: product.isFeatured,
        }}
        hasInventory={Boolean(stock)}
      />
    </Screen>
  );
}

function SetupStock({ productId }: { productId: string }) {
  const setup = useVendorMutation(
    () => api.createInventory({ storeProductId: productId, stockQuantity: 0 }),
    "Stock tracking enabled",
  );
  return (
    <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ flex: 1, color: palette.ink, fontSize: 13 }}>
        Stock is not set up for this product.
      </Text>
      <ActionButton
        title={setup.isPending ? "Setting up…" : "Set up stock"}
        disabled={setup.isPending}
        onPress={() => setup.mutate(undefined)}
      />
    </Card>
  );
}

function ProductEditor({
  productId,
  initial,
  hasInventory,
}: {
  productId: string;
  initial: {
    mrp: string;
    sellingPrice: string;
    availabilityStatus: AvailabilityStatus;
    trackInventory: boolean;
    isFeatured: boolean;
  };
  hasInventory: boolean;
}) {
  const [mrp, setMrp] = useState(initial.mrp);
  const [sellingPrice, setSellingPrice] = useState(initial.sellingPrice);
  const [availabilityStatus, setAvailabilityStatus] = useState(initial.availabilityStatus);
  const [trackInventory, setTrackInventory] = useState(initial.trackInventory);
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const update = useVendorMutation(async (input: UpdateStoreProductInput) => {
    const saved = await api.updateStoreProduct(productId, input);
    if (input.trackInventory && !hasInventory) {
      await api.createInventory({ storeProductId: productId, stockQuantity: 0 });
    }
    return saved;
  }, "Product details saved");
  const remove = useVendorMutation(() => api.deleteStoreProduct(productId), "Product removed");
  const discount = discountPercent(Number(mrp), Number(sellingPrice));

  return (
    <Section title="Price & visibility">
      <Card>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="MRP (₹)" keyboardType="decimal-pad" value={mrp} onChangeText={setMrp} />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Your price (₹)"
              keyboardType="decimal-pad"
              value={sellingPrice}
              onChangeText={setSellingPrice}
            />
          </View>
        </View>
        {discount > 0 ? (
          <Text
            style={{ marginBottom: 12, color: palette.primary, fontSize: 12, fontWeight: "700" }}
          >
            Customers see {discount}% off
          </Text>
        ) : null}
        <Text style={styles.label}>Availability</Text>
        <View style={styles.wrap}>
          {availabilityOptions.map((status) => (
            <Pressable key={status} onPress={() => setAvailabilityStatus(status)}>
              <Tag
                text={status.replaceAll("_", " ")}
                tone={status === availabilityStatus ? "green" : "neutral"}
              />
            </Pressable>
          ))}
        </View>
        <Toggle
          title="Track stock"
          enabled={trackInventory}
          onPress={() => setTrackInventory((value) => !value)}
        />
        <Toggle
          title="Featured product"
          enabled={isFeatured}
          onPress={() => setIsFeatured((value) => !value)}
        />
        <ActionButton
          title={update.isPending ? "Saving…" : "Save changes"}
          disabled={update.isPending}
          onPress={() =>
            update.mutate({
              mrp: Number(mrp),
              sellingPrice: Number(sellingPrice),
              availabilityStatus,
              trackInventory,
              isFeatured,
            })
          }
        />
      </Card>
      <View style={{ marginTop: 12 }}>
        <ActionButton
          title="Remove from store"
          secondary
          danger
          disabled={remove.isPending}
          onPress={() =>
            Alert.alert("Remove product?", "This removes the product from your store.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () =>
                  remove.mutate(undefined, { onSuccess: () => router.replace("/(tabs)/products") }),
              },
            ])
          }
        />
      </View>
    </Section>
  );
}

function Toggle({
  title,
  enabled,
  onPress,
}: {
  title: string;
  enabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 13,
        borderTopWidth: 1,
        borderColor: palette.border,
      }}
    >
      <Text style={{ color: palette.ink, fontSize: 13, fontWeight: "700" }}>{title}</Text>
      <Tag text={enabled ? "On" : "Off"} tone={enabled ? "green" : "neutral"} />
    </Pressable>
  );
}

function StockManager({ inventory }: { inventory: Inventory }) {
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [type, setType] = useState<InventoryTransactionType>("RESTOCK");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [threshold, setThreshold] = useState(String(inventory.lowStockThreshold));
  const transactions = useQuery({
    queryKey: ["vendor", "transactions", inventory.id],
    queryFn: () => api.getTransactions(inventory.id),
  });
  const adjust = useVendorMutation(
    () =>
      api.adjustInventory(inventory.id, {
        transactionType: type,
        quantity: Number(quantity),
        referenceType: "MANUAL",
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        expectedVersion: inventory.version,
      }),
    "Stock updated",
  );
  const saveThreshold = useVendorMutation(
    () => api.updateInventory(inventory.id, { lowStockThreshold: Number(threshold) }),
    "Stock alert saved",
  );
  const preview = quantity
    ? applyStockChange(inventory.stockQuantity, inventory.reservedQuantity, type, Number(quantity))
    : null;
  const transactionTypes = direction === "in" ? STOCK_IN : STOCK_OUT;
  const previewError = preview !== null && "error" in preview;

  return (
    <View style={{ gap: 10 }}>
      <Card style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <StockStat
          title="In stock"
          value={inventory.stockQuantity}
          warning={isLowStock(inventory.stockQuantity, inventory.lowStockThreshold)}
        />
        <StockStat title="Held for orders" value={inventory.reservedQuantity} />
        <StockStat title="Alert at" value={inventory.lowStockThreshold} />
      </Card>
      <Card>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {(["in", "out"] as const).map((value) => (
            <View key={value} style={{ flex: 1 }}>
              <ActionButton
                title={value === "in" ? "Add stock" : "Remove stock"}
                secondary={direction !== value}
                onPress={() => {
                  setDirection(value);
                  setType(value === "in" ? "RESTOCK" : "SALE");
                }}
              />
            </View>
          ))}
        </View>
        <View style={styles.wrap}>
          {transactionTypes.map((value) => (
            <Pressable key={value} onPress={() => setType(value)}>
              <Tag text={txLabel[value]} tone={type === value ? "green" : "neutral"} />
            </Pressable>
          ))}
        </View>
        <Field
          label="Units"
          keyboardType="numeric"
          value={quantity}
          onChangeText={(value) => setQuantity(value.replace(/\D/g, ""))}
          placeholder="Enter quantity"
        />
        <Field
          label="Note (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add a note"
        />
        {preview ? (
          <Text
            style={{
              marginBottom: 12,
              color: previewError ? palette.danger : palette.muted,
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {previewError ? preview.error : `New stock balance: ${preview.stock}`}
          </Text>
        ) : null}
        <ActionButton
          title={adjust.isPending ? "Updating…" : "Update stock"}
          disabled={!preview || previewError || adjust.isPending}
          onPress={() =>
            adjust.mutate(undefined, {
              onSuccess: () => {
                setQuantity("");
                setNotes("");
              },
            })
          }
        />
      </Card>
      <Card>
        <Field
          label="Warn me at or below (units)"
          keyboardType="numeric"
          value={threshold}
          onChangeText={(value) => setThreshold(value.replace(/\D/g, ""))}
        />
        <ActionButton
          title={saveThreshold.isPending ? "Saving…" : "Save alert level"}
          secondary
          disabled={saveThreshold.isPending || threshold === String(inventory.lowStockThreshold)}
          onPress={() => saveThreshold.mutate(undefined)}
        />
      </Card>
      {transactions.isLoading ? (
        <Loading />
      ) : transactions.error ? (
        <ErrorNote message={transactions.error.message} />
      ) : transactions.data?.length ? (
        <Card>
          <Text
            style={{
              marginBottom: 9,
              color: palette.muted,
              fontSize: 11,
              fontWeight: "900",
              letterSpacing: 0.6,
            }}
          >
            RECENT STOCK HISTORY
          </Text>
          {transactions.data.slice(0, 8).map((transaction) => {
            const positive = STOCK_IN.includes(transaction.transactionType);
            return (
              <View
                key={transaction.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 9,
                  borderTopWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.ink, fontSize: 12, fontWeight: "800" }}>
                    {txLabel[transaction.transactionType]}
                  </Text>
                  <Text style={{ marginTop: 2, color: palette.muted, fontSize: 11 }}>
                    {timeAgo(transaction.createdAt)}
                    {transaction.notes ? ` · ${transaction.notes}` : ""}
                  </Text>
                </View>
                <Text
                  style={{
                    color: positive ? palette.primary : palette.danger,
                    fontSize: 13,
                    fontWeight: "900",
                  }}
                >
                  {positive ? "+" : "−"}
                  {transaction.quantity} · left {transaction.balanceAfterTransaction}
                </Text>
              </View>
            );
          })}
        </Card>
      ) : null}
    </View>
  );
}

function StockStat({
  title,
  value,
  warning = false,
}: {
  title: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text
        style={{ color: warning ? palette.warning : palette.ink, fontSize: 21, fontWeight: "900" }}
      >
        {value}
      </Text>
      <Text style={{ color: palette.muted, fontSize: 10, fontWeight: "700", textAlign: "center" }}>
        {title}
      </Text>
    </View>
  );
}

const styles = {
  label: { marginBottom: 8, color: palette.ink, fontSize: 13, fontWeight: "800" as const },
  wrap: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 7, marginBottom: 10 },
};

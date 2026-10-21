import { useMemo, useState } from "react";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react-native";
import * as api from "../../src/features/vendor/api/vendor";
import { isLowStock, formatINR } from "../../src/features/vendor/rules";
import {
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Loading,
  palette,
  Screen,
  Section,
  Tag,
  TopBar,
} from "../../src/native/ui";

export default function ProductsScreen() {
  const products = useQuery({ queryKey: ["vendor", "products"], queryFn: api.getStoreProducts });
  const master = useQuery({
    queryKey: ["vendor", "master-products"],
    queryFn: api.getMasterProducts,
    staleTime: 300_000,
  });
  const inventory = useQuery({ queryKey: ["vendor", "inventory"], queryFn: api.getInventory });
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const rows = useMemo(() => {
    const masterById = new Map((master.data ?? []).map((item) => [item.id, item]));
    const stockByProduct = new Map(
      (inventory.data ?? []).map((item) => [item.storeProductId, item]),
    );
    return (products.data ?? [])
      .map((product) => ({
        product,
        master: masterById.get(product.masterProductId),
        stock: stockByProduct.get(product.id),
      }))
      .filter(
        ({ master: item, stock }) =>
          (!search ||
            item?.name.toLowerCase().includes(search.toLowerCase()) ||
            item?.sku.toLowerCase().includes(search.toLowerCase())) &&
          (!lowOnly || Boolean(stock && isLowStock(stock.stockQuantity, stock.lowStockThreshold))),
      )
      .sort((a, b) => a.product.displayOrder - b.product.displayOrder);
  }, [products.data, master.data, inventory.data, search, lowOnly]);
  const lowCount = (inventory.data ?? []).filter((item) =>
    isLowStock(item.stockQuantity, item.lowStockThreshold),
  ).length;

  return (
    <Screen>
      <TopBar
        title="Products"
        subtitle={`${products.data?.length ?? 0} listed in your store`}
        right={
          <Link href="/products/new" asChild>
            <Pressable style={{ padding: 8 }}>
              <Plus size={22} color={palette.primary} />
            </Pressable>
          </Link>
        }
      />
      <Section>
        <Field
          label="Search"
          placeholder="Search products or SKU"
          value={search}
          onChangeText={setSearch}
        />
        {lowCount > 0 ? (
          <Pressable onPress={() => setLowOnly((value) => !value)}>
            <Tag
              text={`${lowOnly ? "Show all" : "Running low"} · ${lowCount}`}
              tone={lowOnly ? "yellow" : "neutral"}
            />
          </Pressable>
        ) : null}
      </Section>
      {products.isLoading || master.isLoading ? (
        <Loading />
      ) : products.error ? (
        <ErrorNote message={products.error.message} />
      ) : (
        <Section>
          {rows.length === 0 ? (
            <EmptyState
              title="No matching products"
              body={
                search || lowOnly
                  ? "Try another search or clear the low-stock filter."
                  : "Add your first product from the aasPass catalogue."
              }
            />
          ) : (
            <View style={{ gap: 9 }}>
              {rows.map(({ product, master: item, stock }) => {
                const low = Boolean(
                  stock && isLowStock(stock.stockQuantity, stock.lowStockThreshold),
                );
                return (
                  <Link
                    key={product.id}
                    href={{ pathname: "/products/[productId]", params: { productId: product.id } }}
                    asChild
                  >
                    <Pressable>
                      <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: palette.ink, fontSize: 14, fontWeight: "800" }}>
                            {item?.name ?? "Unknown product"}
                          </Text>
                          <Text style={{ marginTop: 3, color: palette.muted, fontSize: 11 }}>
                            {item ? `${item.unitValue} · ${item.sku}` : product.masterProductId}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 6,
                              marginTop: 8,
                              alignItems: "center",
                            }}
                          >
                            <Tag
                              text={product.availabilityStatus.replaceAll("_", " ")}
                              tone={
                                product.availabilityStatus === "AVAILABLE" ? "green" : "neutral"
                              }
                            />
                            {product.trackInventory ? (
                              <Text
                                style={{
                                  color: low ? palette.warning : palette.muted,
                                  fontSize: 11,
                                  fontWeight: "700",
                                }}
                              >
                                {stock ? `${stock.stockQuantity} in stock` : "Set up stock"}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                        <Text style={{ color: palette.ink, fontWeight: "900" }}>
                          {formatINR(product.sellingPrice)}
                        </Text>
                      </Card>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          )}
        </Section>
      )}
    </Screen>
  );
}

import { queryOptions } from "@tanstack/react-query";
import { products, replaceCatalogData } from "./data";
import { browseStores, getStoreProducts, type BackendStoreProductResponse, type BackendStoreResponse } from "./api/stores";
import type { Category, Product, Store } from "./model";
import { getConnection } from "./api/config";

const toClockTime = (value: string | null | undefined) => {
  if (!value) return undefined;
  return value.match(/T(\d{2}:\d{2})/)?.[1] ?? value.slice(0, 5);
};

const todayName = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][new Date().getDay()];

const mapStore = (store: BackendStoreResponse): Store => {
  const hours = store.hours?.find((entry) => entry.weekDay === todayName);
  return {
    id: store.id,
    name: store.name,
    kind: store.description || `${store.city}, ${store.state}`,
    minOrder: Number(store.deliverySetting?.minimumOrderAmount ?? 0),
    deliveryFee: Number(store.deliverySetting?.deliveryCharge ?? 0),
    freeDeliveryAbove: store.deliverySetting?.freeDeliveryAbove == null
      ? undefined
      : Number(store.deliverySetting.freeDeliveryAbove),
    note: store.description || undefined,
    open: store.isOpen && !hours?.isClosed,
    openTime: toClockTime(hours?.openingTime),
    closeTime: toClockTime(hours?.closingTime),
    supportsPickup: store.deliverySetting?.isPickupAvailable ?? false,
    phone: store.phone,
  };
};

const mapProduct = (storeProduct: BackendStoreProductResponse): Product => ({
  id: storeProduct.id,
  storeId: storeProduct.storeId,
  name: storeProduct.masterProduct.name,
  brand: storeProduct.masterProduct.brand?.name ?? "",
  category: (storeProduct.masterProduct.category?.name ?? "") as Category,
  unit: storeProduct.masterProduct.unit?.symbol ?? String(storeProduct.masterProduct.unitValue),
  description: storeProduct.masterProduct.description ?? "",
  price: Number(storeProduct.sellingPrice),
  mrp: Number(storeProduct.mrp),
  image: productImageUrl(
    storeProduct.masterProduct.images?.find((image) => image.isPrimary)?.objectKey
      ?? storeProduct.masterProduct.images?.[0]?.objectKey,
  ),
  stockQty: Math.max(0, (storeProduct.inventory?.stockQuantity ?? 0) - (storeProduct.inventory?.reservedQuantity ?? 0)),
});

const productImageUrl = (objectKey: string | undefined) => {
  const { supabaseUrl } = getConnection();
  const bucket = process.env.EXPO_PUBLIC_SUPABASE_CATALOG_BUCKET || "aaspass-catalog";
  if (!objectKey || !supabaseUrl) return undefined;
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedKey}`;
};

const loadStores = async () => (await browseStores()).map(mapStore);

const loadProducts = async () => {
  const backendStores = await browseStores();
  const grouped = await Promise.all(backendStores.map((store) => getStoreProducts(store.id)));
  return grouped.flat().map(mapProduct);
};

export const storesQuery = queryOptions({
  queryKey: ["stores"],
  queryFn: async () => {
    const nextStores = await loadStores();
    replaceCatalogData(nextStores, products);
    return nextStores;
  },
  staleTime: 60_000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const [nextStores, nextProducts] = await Promise.all([loadStores(), loadProducts()]);
    replaceCatalogData(nextStores, nextProducts);
    return nextProducts;
  },
  staleTime: 60_000,
});

export const storeQuery = (id: string) => queryOptions({
  queryKey: ["stores", id],
  queryFn: async () => {
    const nextStores = await loadStores();
    replaceCatalogData(nextStores, products);
    return nextStores.find((store) => store.id === id) ?? null;
  },
  staleTime: 60_000,
});

export const productQuery = (id: string) => queryOptions({
  queryKey: ["products", id],
  queryFn: async () => {
    const [nextStores, nextProducts] = await Promise.all([loadStores(), loadProducts()]);
    replaceCatalogData(nextStores, nextProducts);
    return nextProducts.find((product) => product.id === id) ?? null;
  },
  staleTime: 60_000,
});

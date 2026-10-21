// One adapter per backend capability. Live sessions call the real aasPass API;
// sample-store sessions read and write an in-memory copy of the demo data.
import * as demo from "../demo-data";
import type {
  AdjustInventoryInput,
  Category,
  CreateInventoryInput,
  CreateStoreInput,
  CreateStoreProductInput,
  DeliverySettings,
  Inventory,
  InventoryTransaction,
  MasterProduct,
  Order,
  OrderStatus,
  Store,
  StoreHour,
  StoreHourInput,
  StoreProduct,
  Unit,
  UpdateDeliverySettingsInput,
  UpdateStoreInput,
  UpdateStoreProductInput,
} from "../model";
import { applyStockChange, nextOrderStatuses, validatePrice } from "../rules";
import { isLive } from "../session";
import { apiFetch } from "./client";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const db = {
  store: clone(demo.demoStore) as Store | null,
  hours: clone(demo.demoHours),
  delivery: clone(demo.demoDelivery),
  products: clone(demo.demoStoreProducts),
  inventory: clone(demo.demoInventory),
  transactions: clone(demo.demoTransactions),
  orders: clone(demo.demoOrders),
};
const wait = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(clone(v)), 150));
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const stamp = () => new Date().toISOString();
const body = (data: unknown) => JSON.stringify(data);

// ---------------- Store profile (/stores/me) ----------------
export const getMyStore = async (): Promise<Store | null> => {
  if (!isLive()) return wait(db.store);
  try {
    return await apiFetch<Store>("/stores/me");
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
};
export const createStore = async (input: CreateStoreInput): Promise<Store> => {
  if (isLive()) return apiFetch<Store>("/stores", { method: "POST", body: body(input) });
  db.store = {
    ...demo.demoStore,
    ...input,
    id: uid("store"),
    status: "PENDING",
    verificationStatus: "PENDING",
    verifiedAt: null,
  } as Store;
  return wait(db.store);
};
export const updateStore = async (input: UpdateStoreInput): Promise<Store> => {
  if (isLive()) return apiFetch<Store>("/stores/me", { method: "PATCH", body: body(input) });
  db.store = { ...(db.store as Store), ...input, updatedAt: stamp() };
  return wait(db.store);
};

// ---------------- Hours (/stores/me/hours) ----------------
const toHHMM = (v: string | null) =>
  v ? (v.includes("T") ? v.slice(11, 16) : v.slice(0, 5)) : null;
export const getHours = async (): Promise<StoreHour[]> => {
  const rows = isLive() ? await apiFetch<StoreHour[]>("/stores/me/hours") : await wait(db.hours);
  return rows.map((h) => ({
    ...h,
    openingTime: toHHMM(h.openingTime),
    closingTime: toHHMM(h.closingTime),
  }));
};
export const saveHours = async (hours: StoreHourInput[]): Promise<StoreHour[]> => {
  if (isLive())
    return apiFetch<StoreHour[]>("/stores/me/hours", { method: "PUT", body: body({ hours }) });
  db.hours = hours.map((h, i) => ({
    id: `hour-${i}`,
    weekDay: h.weekDay,
    isClosed: h.isClosed,
    openingTime: h.isClosed ? null : (h.openingTime ?? null),
    closingTime: h.isClosed ? null : (h.closingTime ?? null),
  }));
  return wait(db.hours);
};

// ---------------- Delivery (/stores/me/delivery-settings) ----------------
export const getDelivery = async (): Promise<DeliverySettings> =>
  isLive() ? apiFetch("/stores/me/delivery-settings") : wait(db.delivery);
export const updateDelivery = async (
  input: UpdateDeliverySettingsInput,
): Promise<DeliverySettings> => {
  if (isLive())
    return apiFetch("/stores/me/delivery-settings", { method: "PATCH", body: body(input) });
  db.delivery = { ...db.delivery, ...input };
  return wait(db.delivery);
};

// ---------------- Catalog (read-only for vendors) ----------------
export const getMasterProducts = async (): Promise<MasterProduct[]> =>
  isLive() ? apiFetch("/catalog/master-products") : wait(demo.demoMasterProducts);
export const getCategories = async (): Promise<Category[]> =>
  isLive() ? apiFetch("/catalog/categories") : wait(demo.demoCategories);
export const getUnits = async (): Promise<Unit[]> =>
  isLive() ? apiFetch("/catalog/units") : wait(demo.demoUnits);

// ---------------- Store products (/catalog/store-products/me) ----------------
export const getStoreProducts = async (): Promise<StoreProduct[]> =>
  isLive() ? apiFetch("/catalog/store-products/me") : wait(db.products);
export const createStoreProduct = async (input: CreateStoreProductInput): Promise<StoreProduct> => {
  const err = validatePrice(input.mrp, input.sellingPrice);
  if (err) throw new Error(err);
  if (isLive())
    return apiFetch("/catalog/store-products/me", { method: "POST", body: body(input) });
  if (db.products.some((p) => p.masterProductId === input.masterProductId))
    throw new Error("This product is already in your store");
  const row: StoreProduct = {
    id: uid("sp"),
    storeId: db.store?.id ?? "",
    masterProductId: input.masterProductId,
    mrp: input.mrp.toFixed(2),
    sellingPrice: input.sellingPrice.toFixed(2),
    availabilityStatus: input.availabilityStatus ?? "AVAILABLE",
    trackInventory: input.trackInventory ?? true,
    isFeatured: input.isFeatured ?? false,
    displayOrder: input.displayOrder ?? db.products.length,
    createdAt: stamp(),
    updatedAt: stamp(),
  };
  db.products.push(row);
  return wait(row);
};
export const updateStoreProduct = async (
  id: string,
  input: UpdateStoreProductInput,
): Promise<StoreProduct> => {
  const current = db.products.find((p) => p.id === id);
  const mrp = input.mrp ?? (current ? Number(current.mrp) : undefined);
  const sp = input.sellingPrice ?? (current ? Number(current.sellingPrice) : undefined);
  if (mrp !== undefined && sp !== undefined) {
    const err = validatePrice(mrp, sp);
    if (err) throw new Error(err);
  }
  if (isLive())
    return apiFetch(`/catalog/store-products/me/${id}`, { method: "PATCH", body: body(input) });
  if (!current) throw new Error("Product not found");
  Object.assign(current, {
    ...input,
    ...(input.mrp !== undefined ? { mrp: input.mrp.toFixed(2) } : {}),
    ...(input.sellingPrice !== undefined ? { sellingPrice: input.sellingPrice.toFixed(2) } : {}),
    updatedAt: stamp(),
  });
  return wait(current);
};
export const deleteStoreProduct = async (id: string): Promise<void> => {
  if (isLive()) return apiFetch(`/catalog/store-products/me/${id}`, { method: "DELETE" });
  db.products = db.products.filter((p) => p.id !== id);
  db.inventory = db.inventory.filter((i) => i.storeProductId !== id);
};

// ---------------- Inventory (/inventory/me) ----------------
export const getInventory = async (): Promise<Inventory[]> =>
  isLive() ? apiFetch("/inventory/me") : wait(db.inventory);
export const createInventory = async (input: CreateInventoryInput): Promise<Inventory> => {
  if (isLive()) return apiFetch("/inventory/me", { method: "POST", body: body(input) });
  const row: Inventory = {
    id: uid("inv"),
    storeProductId: input.storeProductId,
    stockQuantity: input.stockQuantity ?? 0,
    reservedQuantity: 0,
    lowStockThreshold: input.lowStockThreshold ?? 5,
    reorderLevel: input.reorderLevel ?? 10,
    version: 1,
    lastStockUpdate: stamp(),
  };
  db.inventory.push(row);
  if (row.stockQuantity > 0)
    db.transactions.unshift({
      id: uid("tx"),
      inventoryId: row.id,
      transactionType: "RESTOCK",
      quantity: row.stockQuantity,
      balanceAfterTransaction: row.stockQuantity,
      referenceType: "MANUAL",
      notes: "Opening stock",
      createdAt: stamp(),
    });
  return wait(row);
};
export const updateInventory = async (
  id: string,
  input: { lowStockThreshold?: number; reorderLevel?: number },
): Promise<Inventory> => {
  if (isLive()) return apiFetch(`/inventory/me/${id}`, { method: "PATCH", body: body(input) });
  const row = db.inventory.find((i) => i.id === id);
  if (!row) throw new Error("Stock record not found");
  Object.assign(row, input);
  return wait(row);
};
export const adjustInventory = async (
  id: string,
  input: AdjustInventoryInput,
): Promise<Inventory> => {
  if (isLive())
    return apiFetch(`/inventory/me/${id}/adjust`, { method: "POST", body: body(input) });
  const row = db.inventory.find((i) => i.id === id);
  if (!row) throw new Error("Stock record not found");
  if (row.version !== input.expectedVersion)
    throw new Error("Stock changed elsewhere. Refresh and try again.");
  const result = applyStockChange(
    row.stockQuantity,
    row.reservedQuantity,
    input.transactionType,
    input.quantity,
  );
  if ("error" in result) throw new Error(result.error);
  Object.assign(row, {
    stockQuantity: result.stock,
    version: row.version + 1,
    lastStockUpdate: stamp(),
  });
  db.transactions.unshift({
    id: uid("tx"),
    inventoryId: id,
    transactionType: input.transactionType,
    quantity: input.quantity,
    balanceAfterTransaction: result.stock,
    referenceType: input.referenceType ?? "MANUAL",
    notes: input.notes ?? null,
    createdAt: stamp(),
  });
  return wait(row);
};
export const getTransactions = async (id: string): Promise<InventoryTransaction[]> =>
  isLive()
    ? apiFetch(`/inventory/me/${id}/transactions`)
    : wait(db.transactions.filter((t) => t.inventoryId === id));

// ---------------- Orders ----------------
// The backend has no store-side order endpoints yet (orders are customer-only),
// so the vendor order queue always uses sample orders.
export const ORDERS_ARE_PREVIEW = true;
export const getOrders = async (): Promise<Order[]> =>
  wait([...db.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)));
export const getOrder = async (id: string): Promise<Order | null> =>
  wait(db.orders.find((o) => o.id === id) ?? null);
export const setOrderStatus = async (id: string, status: OrderStatus): Promise<Order> => {
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw new Error("Order not found");
  if (!nextOrderStatuses(order.status, order.fulfillmentType).includes(status))
    throw new Error("That step isn't allowed now");
  order.status = status;
  if (status === "DELIVERED" && order.paymentMethod === "COD") order.paymentStatus = "PAID";
  return wait(order);
};
export const markCodPaid = async (id: string): Promise<Order> => {
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw new Error("Order not found");
  order.paymentStatus = "PAID";
  return wait(order);
};

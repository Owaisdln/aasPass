// ---------------------------------------------------------------------------
// Domain types and pure helpers. Pure domain logic, safe for React Native.
// ---------------------------------------------------------------------------

import { colors } from "./theme";

export type Category = string;

export const categoryColors: Record<string, { bg: string; text: string }> = {
  "Fruits & Veggies": { bg: colors.freshSoft, text: colors.freshText },
  Dairy: { bg: colors.dairySoft, text: colors.dairyText },
  Bakery: { bg: colors.dailySoft, text: colors.dailyText },
  Snacks: { bg: colors.snackSoft, text: colors.snackText },
  Beverages: { bg: colors.bevSoft, text: colors.bevText },
  "Personal Care": { bg: colors.careSoft, text: colors.careText },
  Household: { bg: colors.homeSoft, text: colors.homeText },
  Health: { bg: colors.healthSoft, text: colors.healthText },
};

// --- Stores ----------------------------------------------------------------

export type Store = {
  id: string;
  name: string;
  featured?: boolean;
  kind?: string;
  distanceKm?: number;
  rating?: number;
  minOrder: number;
  deliveryFee: number;
  freeDeliveryAbove?: number;
  note?: string;
  open: boolean;
  openTime?: string;
  closeTime?: string;
  supportsPickup: boolean;
  phone: string;
};

export type StoreHoursStatus = { open: boolean; label: string };

const toMinutes = (time: string | undefined) => {
  const [hours = 0, minutes = 0] = (time ?? "00:00").split(":").map(Number);
  return hours * 60 + minutes;
};

const formatTime = (time: string | undefined) => {
  const minutes = toMinutes(time);
  const hours24 = Math.floor(minutes / 60);
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
};

/** Live open/closed check from the store's hours — mirrors store_hours + isOpen. */
export const getStoreHoursStatus = (store: Store | undefined, now: Date = new Date()): StoreHoursStatus => {
  if (!store) return { open: false, label: "Hours unavailable" };
  const current = now.getHours() * 60 + now.getMinutes();
  if (!store.openTime || !store.closeTime) {
    return { open: store.open, label: store.open ? "Open now" : "Closed" };
  }
  const opens = toMinutes(store.openTime);
  const closes = toMinutes(store.closeTime);
  if (store.open && current >= opens && current < closes) {
    return { open: true, label: `Open · Closes at ${formatTime(store.closeTime)}` };
  }
  const opensLabel = current < opens
    ? `Opens at ${formatTime(store.openTime)}`
    : `Opens tomorrow at ${formatTime(store.openTime)}`;
  return { open: false, label: `Closed · ${opensLabel}` };
};

// --- Products & live stock -------------------------------------------------

export type Product = {
  id: string;
  storeId: string;
  name: string;
  brand: string;
  category: Category;
  unit: string;
  description: string;
  price: number;
  mrp: number;
  image?: string;
  /** Units the store currently has on hand — maps to inventory quantity. */
  stockQty: number;
};

/** At or below this many units we surface an "Only N left" nudge. */
export const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = { available: boolean; low: boolean; quantity: number; label: string };

export const getStockStatus = (product: Product | undefined): StockStatus => {
  const quantity = Math.max(0, product?.stockQty ?? 0);
  if (!quantity) return { available: false, low: false, quantity: 0, label: "Out of stock" };
  if (quantity <= LOW_STOCK_THRESHOLD) return { available: true, low: true, quantity, label: `Only ${quantity} left` };
  return { available: true, low: false, quantity, label: "In stock" };
};

export const isInStock = (product: Product | undefined) => getStockStatus(product).available;

// --- Addresses & sessions --------------------------------------------------

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

/** One signed-in device — maps to a refresh-token session on the backend. */
export type Session = {
  id: string;
  device: string;
  platform: string;
  location: string;
  lastActive: string;
  current: boolean;
};

// --- Cart & orders ---------------------------------------------------------

export type CartLine = { productId: string; quantity: number };
export type OrderStatus = "PENDING" | "CANCELLED";
/** A line copied from a backend order (name/price snapshots, not demo ids). */
export type OrderLineSnapshot = { name: string; unit: string; quantity: number; price: number };
export type ReplacementStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

/** Mirrors order_item_replacements: snapshots, merchant reason, customer response. */
export type OrderItemReplacement = {
  id: string;
  originalProductId: string;
  replacementProductId: string;
  quantity: number;
  replacementPriceSnapshot: number;
  merchantReason: string;
  status: ReplacementStatus;
  requestedAt: string;
  respondedAt?: string | undefined;
  customerResponse?: string | undefined;
};

export type OrderPayment = {
  method: "COD" | "ONLINE";
  status: "PENDING" | "PAID";
  /** Server payment UUID once the backend confirms the record. */
  paymentId?: string | undefined;
};

export type DemoOrder = {
  id: string;
  storeId: string;
  items: CartLine[];
  total: number;
  status: OrderStatus;
  placedAt: string;
  fulfilment: "delivery" | "pickup";
  deliveryInstructions?: string | undefined;
  deliveryPin?: string | undefined;
  customerNote?: string | undefined;
  /** Payment record — maps to the payments module (COD recorded, online later). */
  payment?: OrderPayment | undefined;
  replacements: OrderItemReplacement[];
  /** Server order UUID when the order came from / was sent to the backend. */
  serverId?: string | undefined;
  /** Human-readable tracking number from the backend. */
  orderNumber?: string | undefined;
  /** Real backend status (PENDING, CONFIRMED, OUT_FOR_DELIVERY, …). */
  statusLabel?: string | undefined;
  /** Price snapshots from the backend order items (live orders only). */
  lines?: OrderLineSnapshot[] | undefined;
};

export type PaymentMethod = {
  id: string;
  label: string;
  detail: string;
  available: boolean;
};

export const formatMoney = (amount: number) => {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

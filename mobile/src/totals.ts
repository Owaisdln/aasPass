// ---------------------------------------------------------------------------
// Pure cart maths and stock checks — no UI or browser dependency.
// ---------------------------------------------------------------------------

import { getProduct, getStore } from "./data";
import { getStockStatus, type CartLine } from "./model";

export type CartSummary = {
  subtotal: number;
  mrpTotal: number;
  savings: number;
  deliveryFee: number;
  total: number;
  freeDeliveryAbove: number;
  freeDeliveryGap: number;
  minOrder: number;
  minOrderGap: number;
  meetsMinimum: boolean;
  itemCount: number;
};

export const summariseCart = (
  lines: CartLine[],
  storeId: string | null,
  fulfilment: "delivery" | "pickup" = "delivery",
): CartSummary => {
  const store = storeId ? getStore(storeId) : undefined;
  let subtotal = 0;
  let mrpTotal = 0;
  let itemCount = 0;
  for (const line of lines) {
    const product = getProduct(line.productId);
    if (!product) continue;
    subtotal += product.price * line.quantity;
    mrpTotal += product.mrp * line.quantity;
    itemCount += line.quantity;
  }
  const freeDeliveryAbove = store?.freeDeliveryAbove ?? 0;
  const minOrder = store?.minOrder ?? 0;
  const deliveryFee =
    fulfilment === "pickup" || !freeDeliveryAbove || subtotal >= freeDeliveryAbove
      ? 0
      : (store?.deliveryFee ?? 0);
  return {
    subtotal,
    mrpTotal,
    savings: Math.max(0, mrpTotal - subtotal),
    deliveryFee,
    total: subtotal + deliveryFee,
    freeDeliveryAbove,
    freeDeliveryGap: Math.max(0, freeDeliveryAbove - subtotal),
    minOrder,
    minOrderGap: Math.max(0, minOrder - subtotal),
    meetsMinimum: subtotal >= minOrder,
    itemCount,
  };
};

/** A cart line the store cannot fulfil right now. */
export type StockIssue = {
  productId: string;
  name: string;
  kind: "out-of-stock" | "not-enough";
  requested: number;
  available: number;
};

/** Blocks checkout: sold-out items, or more units requested than are on hand. */
export const findStockIssues = (lines: CartLine[]): StockIssue[] => {
  const issues: StockIssue[] = [];
  for (const line of lines) {
    const product = getProduct(line.productId);
    if (!product) continue;
    const stock = getStockStatus(product);
    if (!stock.available) {
      issues.push({ productId: product.id, name: product.name, kind: "out-of-stock", requested: line.quantity, available: 0 });
    } else if (line.quantity > stock.quantity) {
      issues.push({ productId: product.id, name: product.name, kind: "not-enough", requested: line.quantity, available: stock.quantity });
    }
  }
  return issues;
};

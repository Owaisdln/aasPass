import type { FulfillmentType, InventoryTransactionType, OrderStatus } from "./model";

/** Money is always shown in INR with two decimals. */
export const formatINR = (value: number | string) =>
  `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Discount percent between MRP and selling price, rounded down. */
export const discountPercent = (mrp: number, selling: number) =>
  mrp > 0 && selling < mrp ? Math.floor(((mrp - selling) / mrp) * 100) : 0;

/** Backend rule: selling price must be > 0 and not above MRP. */
export const validatePrice = (mrp: number, selling: number): string | null => {
  if (!(mrp > 0)) return "MRP must be more than ₹0";
  if (!(selling > 0)) return "Selling price must be more than ₹0";
  if (selling > mrp) return "Selling price can't be higher than MRP";
  return null;
};

/** Mirrors InventoryService.getQuantityDelta. ADJUSTMENT is rejected by the backend. */
export const STOCK_IN: InventoryTransactionType[] = ["PURCHASE", "RESTOCK", "RETURN"];
export const STOCK_OUT: InventoryTransactionType[] = ["SALE", "DAMAGE", "EXPIRED"];
export const stockDelta = (type: InventoryTransactionType, quantity: number) => {
  if (STOCK_IN.includes(type)) return quantity;
  if (STOCK_OUT.includes(type)) return -quantity;
  throw new Error("This kind of stock change isn't supported");
};

/** Returns the new stock or an error message, mirroring backend checks. */
export const applyStockChange = (
  stock: number,
  reserved: number,
  type: InventoryTransactionType,
  quantity: number,
): { stock: number } | { error: string } => {
  if (!Number.isInteger(quantity) || quantity < 1) return { error: "Quantity must be at least 1" };
  const next = stock + stockDelta(type, quantity);
  if (next < 0) return { error: "Stock can't go below zero" };
  if (next < reserved) return { error: "Stock can't be lower than units reserved for orders" };
  return { stock: next };
};

/** Next steps a vendor can move an order to. */
export const nextOrderStatuses = (
  status: OrderStatus,
  fulfillment: FulfillmentType,
): OrderStatus[] => {
  switch (status) {
    case "PENDING":
      return ["CONFIRMED", "CANCELLED"];
    case "CONFIRMED":
      return ["PREPARING", "CANCELLED"];
    case "PREPARING":
      return [fulfillment === "PICKUP" ? "READY_FOR_PICKUP" : "OUT_FOR_DELIVERY"];
    case "READY_FOR_PICKUP":
    case "OUT_FOR_DELIVERY":
      return ["DELIVERED", "FAILED"];
    default:
      return [];
  }
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "New",
  CONFIRMED: "Accepted",
  PREPARING: "Packing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Completed",
  CANCELLED: "Rejected",
  FAILED: "Failed",
};
export const ORDER_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Accept order",
  CANCELLED: "Reject",
  PREPARING: "Start packing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Send out for delivery",
  DELIVERED: "Mark completed",
  FAILED: "Mark failed",
};

export const isLowStock = (stock: number, threshold: number) => stock <= threshold;

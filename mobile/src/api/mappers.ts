// ---------------------------------------------------------------------------
// Translate backend response DTOs into the app's local domain types.
// ---------------------------------------------------------------------------

import type { DemoOrder, Session } from "../model";
import type { OrderResponse } from "./orders";
import type { UserSessionResponse } from "./users";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Being packed",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

const relative = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
};

export const mapOrder = (order: OrderResponse, fallbackStoreId: string): DemoOrder => ({
  id: order.orderNumber || order.id,
  serverId: order.id,
  orderNumber: order.orderNumber,
  storeId: order.storeId || fallbackStoreId,
  items: order.items.map((item) => ({
    productId: item.storeProductId,
    quantity: item.quantity,
  })),
  lines: order.items.map((item) => ({
    name: item.productNameSnapshot,
    unit: item.unitSnapshot,
    quantity: item.quantity,
    price: Number(item.sellingPriceSnapshot),
  })),
  total: Number(order.totalAmount),
  status: order.status,
  statusLabel: STATUS_LABELS[order.status] ?? order.status,
  placedAt: order.placedAt,
  fulfilment: order.fulfillmentType === "PICKUP" ? "pickup" : "delivery",
  deliveryInstructions: order.deliveryInstructions ?? undefined,
  payment: {
    method: "COD",
    status: order.paymentStatus === "PAID" ? "PAID" : "PENDING",
  },
  replacements: [],
});

export const mapSession = (session: UserSessionResponse, index: number): Session => ({
  id: session.id,
  device: session.browser ? `${session.browser} · ${session.deviceType}` : session.deviceType,
  platform: session.os ?? session.deviceType,
  location: "—",
  lastActive: relative(session.lastActivityAt),
  current: index === 0,
});

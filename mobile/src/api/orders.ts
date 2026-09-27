// ---------------------------------------------------------------------------
// Orders API — mirrors the backend OrdersModule exactly.
// ---------------------------------------------------------------------------

import { apiFetch } from "./client";

export type OrderStatusResponse =
  | "PENDING" | "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "FAILED";

export type OrderItemResponse = {
  id: string;
  storeProductId: string;
  quantity: number;
  productNameSnapshot: string;
  unitSnapshot: string;
  mrpSnapshot: number;
  sellingPriceSnapshot: number;
  subtotal: number;
  fulfillmentStatus: string;
};

export type OrderResponse = {
  id: string;
  storeId: string;
  orderNumber: string;
  status: OrderStatusResponse;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  fulfillmentType: "DELIVERY" | "PICKUP";
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryInstructions: string | null;
  placedAt: string;
  cancelledAt: string | null;
  items: OrderItemResponse[];
};

export const listOrders = () => apiFetch<OrderResponse[]>("/orders");
export const getOrder = (orderId: string) => apiFetch<OrderResponse>(`/orders/${orderId}`);

export const cancelOrder = (orderId: string, reason?: string) =>
  apiFetch<OrderResponse>(`/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
  });

export const createOrder = (body: { addressId: string; fulfillmentType: "DELIVERY" | "PICKUP"; notes?: string }) =>
  apiFetch<OrderResponse>("/orders", { method: "POST", body: JSON.stringify(body) });

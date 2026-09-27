// ---------------------------------------------------------------------------
// Carts API — mirrors the backend CartController exactly.
// ---------------------------------------------------------------------------

import { apiFetch } from "./client";

export type CartItemResponse = {
  id: string;
  storeProductId: string;
  quantity: number;
  productNameSnapshot: string;
  unitSnapshot: string;
  mrpSnapshot: number;
  sellingPriceSnapshot: number;
  gstRateSnapshot: number;
  subtotal: number;
};

export type CartResponse = {
  id: string;
  userId: string;
  storeId: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  items: CartItemResponse[];
};

/** GET /carts — fetch the user's active cart */
export const getMyCart = () =>
  apiFetch<CartResponse | null>("/carts");

/** PUT /carts/items — add / update / remove (quantity=0) an item */
export const upsertCartItem = (storeProductId: string, quantity: number) =>
  apiFetch<CartResponse>("/carts/items", {
    method: "PUT",
    body: JSON.stringify({ storeProductId, quantity }),
  });

/** DELETE /carts — clear / abandon the cart */
export const clearCart = () =>
  apiFetch<void>("/carts", { method: "DELETE" });

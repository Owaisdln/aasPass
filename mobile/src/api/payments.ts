// ---------------------------------------------------------------------------
// Payments API — mirrors the backend PaymentsModule exactly.
// ---------------------------------------------------------------------------

import { apiFetch } from "./client";

export type PaymentMethod = "ONLINE" | "COD";
export type PaymentGateway = "RAZORPAY" | "CASH";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED";

export type PaymentResponse = {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  gateway: PaymentGateway;
  paymentStatus: PaymentStatus;
  payableAmount: number;
  currency: "INR";
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const createPaymentForOrder = (orderId: string, paymentMethod: PaymentMethod) =>
  apiFetch<PaymentResponse>(`/payments/orders/${orderId}`, {
    method: "POST",
    body: JSON.stringify({ paymentMethod }),
  });

export const getPaymentForOrder = (orderId: string) =>
  apiFetch<PaymentResponse>(`/payments/orders/${orderId}`);

export const markCodAsPaid = (paymentId: string) =>
  apiFetch<PaymentResponse>(`/payments/${paymentId}/cod-paid`, { method: "PATCH" });

export const createRefund = (paymentId: string, amount: number, reason?: string) =>
  apiFetch<PaymentResponse>(`/payments/refunds`, {
    method: "POST",
    body: JSON.stringify({ paymentId, amount, reason }),
  });

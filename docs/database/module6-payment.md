# Database — Module 6: Payment & Financial Management

> [← Back to Index](../README.md)
> **Schema file:** [`server/prisma/modules/module6.payment.prisma`](../../server/prisma/modules/module6.payment.prisma)
> **Status:** Schema Complete (5 models)
> **Last Updated:** 2026-07-28

---

## Overview

The Payment & Financial Management module handles all monetary transactions and financial documentation:

- **Payments** — one payment record per order, tracking method, gateway, and amounts
- **Payment Transactions** — individual gateway attempts (supports retries and multiple attempts)
- **Refunds** — full or partial refund records linked to a payment
- **Payment Webhooks** — raw gateway event log for idempotent webhook processing
- **Financial Documents** — invoice/receipt/credit note PDF key references per order

---

## Enums

> All enums are mapped to snake_case PostgreSQL enum types via `@@map`.

### `PaymentMethod` -> `payment_method`
How the customer chose to pay.

| Value | Description |
|---|---|
| `COD` | Cash on Delivery |
| `UPI` | Unified Payments Interface |
| `CARD` | Credit / Debit card |
| `NET_BANKING` | Internet banking |
| `WALLET` | Digital wallet (Paytm, PhonePe, etc.) |

---

### `PaymentStatus` -> `payment_status`
Overall payment state of an order.

| Value | Description |
|---|---|
| `PENDING` | Payment not yet attempted |
| `AUTHORIZED` | Payment authorized but not captured |
| `PAID` | Payment successfully captured |
| `FAILED` | Payment failed |
| `CANCELLED` | Payment cancelled |
| `PARTIALLY_REFUNDED` | Part of the amount has been refunded |
| `REFUNDED` | Full amount has been refunded |

---

### `PaymentGateway` -> `payment_gateway`
The payment gateway used to process the transaction.

| Value | Description |
|---|---|
| `RAZORPAY` | Razorpay payment gateway |
| `CASH` | Cash on Delivery (no gateway) |

---

### `PaymentTransactionStatus` -> `payment_transaction_status`
Status of a single gateway transaction attempt.

| Value | Description |
|---|---|
| `INITIATED` | Transaction created but not processed |
| `SUCCESS` | Transaction succeeded |
| `FAILED` | Transaction failed |
| `CANCELLED` | Transaction cancelled |

---

### `RefundStatus` -> `refund_status`
State of a refund request.

| Value | Description |
|---|---|
| `PENDING` | Refund initiated, not yet processed |
| `PROCESSED` | Refund successfully completed |
| `FAILED` | Refund processing failed |

---

### `FinancialDocumentType` -> `financial_document_type`
Type of financial document issued.

| Value | Description |
|---|---|
| `INVOICE` | Tax invoice issued to customer |
| `RECEIPT` | Payment receipt |
| `CREDIT_NOTE` | Credit note for a refund |

---

## Models

> All models map to snake_case PostgreSQL table names via `@@map`. All camelCase fields map to snake_case column names via `@map`.

### `Payment` -> `payments` table

One payment record per order. Tracks the chosen payment method, gateway, and the overall amounts across the full payment lifecycle (paid, refunded).

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `orderId` | `order_id` | UUID | Unique FK -> `orders.id`, Cascade | The order this payment belongs to (1:1) |
| `paymentMethod` | `payment_method` | `PaymentMethod` | Required, Indexed | How the customer paid |
| `paymentStatus` | `payment_status` | `PaymentStatus` | Default: `PENDING`, Indexed | Overall payment state |
| `gateway` | `gateway` | `PaymentGateway` | Required, Indexed | Gateway used to process payment |
| `payableAmount` | `payable_amount` | Decimal(10,2) | Required | Total amount to be collected |
| `paidAmount` | `paid_amount` | Decimal(10,2) | Default: `0` | Amount successfully captured so far |
| `refundedAmount` | `refunded_amount` | Decimal(10,2) | Default: `0` | Total amount refunded so far |
| `currency` | `currency` | VarChar(10) | Default: `INR` | Currency code |
| `paidAt` | `paid_at` | Timestamptz? | Optional, Indexed | When payment was captured |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz | Auto-updated | Timestamp |

**Indexes:** `@@index([paymentStatus])`, `@@index([paymentMethod])`, `@@index([gateway])`, `@@index([paidAt])`, `@@index([gateway, paymentStatus])`
**Relations:**
- `order -> Order` (Cascade)
- `transactions -> PaymentTransaction[]`
- `refunds -> Refund[]`
- `webhooks -> PaymentWebhook[]`

> **Design Notes:**
> - One `Payment` per `Order` (enforced by `@unique` on `orderId`).
> - `paidAmount` accumulates successful transaction amounts; `refundedAmount` accumulates processed refunds.
> - `payableAmount - refundedAmount` = net amount received.

---

### `PaymentTransaction` -> `payment_transactions` table

Records each individual attempt to charge the customer via a payment gateway. A single payment may have multiple transaction attempts (e.g. retry after failure).

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `paymentId` | `payment_id` | UUID | FK -> `payments.id`, Cascade, Indexed | Parent payment |
| `gateway` | `gateway` | `PaymentGateway` | Required, Indexed | Gateway used for this attempt |
| `gatewayOrderId` | `gateway_order_id` | VarChar(255)? | Optional, Indexed | Gateway's order/session ID |
| `gatewayPaymentId` | `gateway_payment_id` | VarChar(255)? | Optional, Indexed | Gateway's payment transaction ID |
| `gatewaySignature` | `gateway_signature` | VarChar(500)? | Optional | Webhook signature for verification |
| `transactionStatus` | `transaction_status` | `PaymentTransactionStatus` | Default: `INITIATED`, Indexed | Status of this attempt |
| `amount` | `amount` | Decimal(10,2) | Required | Amount for this transaction attempt |
| `currency` | `currency` | VarChar(10) | Default: `INR` | Currency code |
| `gatewayResponse` | `gateway_response` | Json? | Optional | Full raw gateway response payload |
| `failureReason` | `failure_reason` | Text? | Optional | Error message if transaction failed |
| `processedAt` | `processed_at` | Timestamptz? | Optional, Indexed | When the gateway processed the request |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |

**Constraints:** `@@unique([gateway, gatewayPaymentId])` — prevents duplicate gateway transaction records per gateway
**Indexes:** `@@index([paymentId])`, `@@index([paymentId, transactionStatus])`, `@@index([transactionStatus])`, `@@index([gateway])`, `@@index([gatewayOrderId])`, `@@index([gatewayPaymentId])`, `@@index([processedAt])`
**Relations:** `payment -> Payment` (Cascade)

> **Design Note:** No `updatedAt` — transaction records are write-once. The `@@unique([gateway, gatewayPaymentId])` constraint prevents processing duplicate gateway transactions. The `gatewayResponse` JSON stores the full raw payload for debugging and compliance.

---

### `Refund` -> `refunds` table

Records a refund (full or partial) against a payment. Tracks the gateway refund ID and processing status.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `paymentId` | `payment_id` | UUID | FK -> `payments.id`, Cascade, Indexed | Parent payment |
| `refundAmount` | `refund_amount` | Decimal(10,2) | Required | Amount to be refunded |
| `refundStatus` | `refund_status` | `RefundStatus` | Default: `PENDING`, Indexed | Current refund state |
| `gatewayRefundId` | `gateway_refund_id` | VarChar(255)? | Optional, Indexed | Gateway's refund transaction ID |
| `refundReason` | `refund_reason` | Text? | Optional | Reason for the refund |
| `gatewayResponse` | `gateway_response` | Json? | Optional | Raw gateway response for this refund |
| `refundedAt` | `refunded_at` | Timestamptz? | Optional, Indexed | When the refund was processed |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz | Auto-updated | Timestamp |

**Indexes:** `@@index([paymentId])`, `@@index([refundStatus])`, `@@index([gatewayRefundId])`, `@@index([refundedAt])`
**Relations:** `payment -> Payment` (Cascade)

> **Design Note:** A payment may have multiple refund records (partial refunds). The sum of all `PROCESSED` refund amounts should equal `Payment.refundedAmount`.

---

### `PaymentWebhook` -> `payment_webhooks` table

Stores every inbound webhook event from payment gateways. Used for idempotent event processing — check `isProcessed` before handling an event.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `paymentId` | `payment_id` | UUID | FK -> `payments.id`, Cascade, Indexed | Associated payment |
| `gatewayEventId` | `gateway_event_id` | VarChar(255) | Unique | Gateway's unique event identifier (idempotency key) |
| `eventType` | `event_type` | VarChar(100) | Required, Indexed | Type of event (e.g. `payment.captured`) |
| `payload` | `payload` | Json | Required | Full raw event payload |
| `isProcessed` | `is_processed` | Boolean | Default: `false`, Indexed | Whether this event has been handled |
| `processedAt` | `processed_at` | Timestamptz? | Optional, Indexed | When the event was processed |
| `processingError` | `processing_error` | Text? | Optional | Error message if processing failed |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |

**Constraints:** `@@unique([gatewayEventId])` — prevents duplicate event processing
**Indexes:** `@@index([paymentId])`, `@@index([eventType])`, `@@index([isProcessed])`, `@@index([processedAt])`
**Relations:** `payment -> Payment` (Cascade)

> **Design Notes:**
> - `@@unique([gatewayEventId])` is the idempotency guard — duplicate webhook deliveries are safely rejected.
> - `processingError` allows failed events to be retried: query `isProcessed = false` and `processingError IS NOT NULL`.
> - No `updatedAt` — webhook records are append-only by design.

---

### `FinancialDocument` -> `financial_documents` table

Stores references to generated financial documents (invoices, receipts, credit notes) for an order. The actual PDF is stored in object storage; only the key is kept here.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `orderId` | `order_id` | UUID | FK -> `orders.id`, Cascade, Indexed | The order this document belongs to |
| `documentType` | `document_type` | `FinancialDocumentType` | Required, Indexed | Type of document |
| `documentNumber` | `document_number` | VarChar(100) | Unique | Document reference number (e.g. `INV-20260722-0001`) |
| `pdfKey` | `pdf_key` | VarChar(500) | Required | Object storage key for the PDF file |
| `generatedAt` | `generated_at` | Timestamptz | Auto: `now()`, Indexed | When the document was generated |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |

**Indexes:** `@@index([orderId])`, `@@index([orderId, documentType])`, `@@index([documentType])`, `@@index([generatedAt])`
**Relations:** `order -> Order` (Cascade)

> **Design Notes:**
> - `pdfKey` stores the object storage path (e.g. `invoices/order-id/invoice.pdf`). The CDN base URL is prepended at read time.
> - `documentNumber` is unique — enforces one reference number per document.
> - No `updatedAt` — financial documents are immutable once generated.

---

## Entity Relationship Diagram

```mermaid
erDiagram
 Order {
 uuid id PK
 string orderNumber UK
 }
 Payment {
 uuid id PK
 uuid orderId FK_UK
 PaymentMethod paymentMethod
 PaymentStatus paymentStatus
 PaymentGateway gateway
 decimal payableAmount
 decimal paidAmount
 decimal refundedAmount
 datetime paidAt
 }
 PaymentTransaction {
 uuid id PK
 uuid paymentId FK
 PaymentGateway gateway
 PaymentTransactionStatus transactionStatus
 decimal amount
 string gatewayOrderId
 string gatewayPaymentId
 datetime processedAt
 }
 Refund {
 uuid id PK
 uuid paymentId FK
 decimal refundAmount
 RefundStatus refundStatus
 string gatewayRefundId
 datetime refundedAt
 }
 PaymentWebhook {
 uuid id PK
 uuid paymentId FK
 string gatewayEventId UK
 string eventType
 bool isProcessed
 datetime processedAt
 }
 FinancialDocument {
 uuid id PK
 uuid orderId FK
 FinancialDocumentType documentType
 string documentNumber UK
 string pdfKey
 datetime generatedAt
 }

 Order ||--|| Payment : "has"
 Order ||--o{ FinancialDocument : "has"
 Payment ||--o{ PaymentTransaction : "has"
 Payment ||--o{ Refund : "has"
 Payment ||--o{ PaymentWebhook : "receives"
```

---

## Payment Flow

```
Customer places order
 |
 +--> Payment record created (status: PENDING)
 |
 +--> PaymentTransaction created (status: INITIATED)
 | |
 | +--> Gateway processes payment
 | |
 | +--> SUCCESS: Update PaymentTransaction + Payment (PAID, paidAmount)
 | |
 | +--> FAILED: Update PaymentTransaction, allow retry
 |
 +--> Gateway sends webhook -> PaymentWebhook stored
 |
 +--> Invoice generated -> FinancialDocument created (pdfKey stored)
 |
 +--> Refund requested
 |
 +--> Refund record created (status: PENDING)
 +--> Gateway processes refund
 +--> Refund.refundStatus = PROCESSED
 +--> Payment.refundedAmount updated
 +--> Credit Note generated -> FinancialDocument (CREDIT_NOTE)
```

---

## Model Summary

| Model | Table | Records Represent |
|---|---|---|
| `Payment` | `payments` | Payment record per order |
| `PaymentTransaction` | `payment_transactions` | Individual gateway charge attempts |
| `Refund` | `refunds` | Full or partial refund records |
| `PaymentWebhook` | `payment_webhooks` | Inbound gateway webhook event log |
| `FinancialDocument` | `financial_documents` | Invoice/receipt/credit note references |

---

## Recommended Post-Migration SQL Enhancements

The following PostgreSQL database constraints are to be applied via a raw SQL migration script after initial Prisma schema generation:

### 1. Payment Amount Integrity CHECK Constraints
Enforces financial data integrity directly at the database engine layer:
```sql
ALTER TABLE payments
 ADD CONSTRAINT chk_payments_paid_le_payable CHECK (paid_amount <= payable_amount),
 ADD CONSTRAINT chk_payments_refunded_le_paid CHECK (refunded_amount <= paid_amount);
```


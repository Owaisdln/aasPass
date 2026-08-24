# Server — Module: Payments

> [← Back to Server Index](./README.md)

---

## 1. Purpose

`PaymentsModule` handles payment creation, Razorpay verification flow, COD collection confirmation, and refund initiation for orders. Every payment record maps 1-to-1 with an `Order`. Gateway-specific details (Razorpay order IDs, signatures) are stored in child `PaymentTransaction` records to keep the parent `Payment` clean.

---

## 2. Module Registration

```
PaymentsModule
  imports:  PrismaModule, AuthModule
  controllers: PaymentsController
  providers:   PaymentsService, PaymentsMapper
  exports:     PaymentsService
```

Registered in `AppModule` — all routes under `/payments` are active.

---

## 3. File Structure

```
src/modules/payments/
  controllers/
    payments.controller.ts     — Route handlers (all guarded by SupabaseAuthGuard)
  dto/
    create-payment.dto.ts      — Input: paymentMethod enum
    verify-payment.dto.ts      — Input: Razorpay gatewayOrderId, gatewayPaymentId, gatewaySignature
    create-refund.dto.ts       — Input: paymentId, amount, optional reason
    payment-response.dto.ts    — Output shape for Payment entity
  mappers/
    payments.mapper.ts         — Static toResponse(): Payment | PaymentWithTransactions -> PaymentResponseDto
  services/
    payments.service.ts        — All business logic
  types/
    payments.types.ts          — PAYMENT_WITH_TRANSACTIONS_INCLUDE constant + PaymentWithTransactions type
  payments.module.ts
```

---

## 4. Endpoints

All routes are guarded at the controller class level by `SupabaseAuthGuard`. The authenticated user's `id` is resolved via the `@AuthenticatedUser()` decorator.

| Method | Path | Handler | Description |
|---|---|---|---|
| `POST` | `/payments/orders/:orderId` | `create` | Creates a new payment record for the given order |
| `GET` | `/payments/orders/:orderId` | `findByOrder` | Fetches the payment associated with an order |
| `POST` | `/payments/:paymentId/verify` | `verifyRazorpayPayment` | Records Razorpay callback data against a transaction |
| `PATCH` | `/payments/:paymentId/cod-paid` | `markCodAsPaid` | Marks a COD payment as collected and updates order payment status |
| `POST` | `/payments/refunds` | `createRefund` | Initiates a refund request against a paid payment |

---

## 5. DTOs

### 5.1 `CreatePaymentDto`

| Field | Validator | Description |
|---|---|---|
| `paymentMethod` | `@IsEnum(PaymentMethod)` | `ONLINE` or `COD` |

### 5.2 `VerifyPaymentDto`

| Field | Validator | Description |
|---|---|---|
| `gatewayOrderId` | `@IsString`, `@Length(1, 255)` | Razorpay order ID |
| `gatewayPaymentId` | `@IsString`, `@Length(1, 255)` | Razorpay payment ID |
| `gatewaySignature` | `@IsString`, `@Length(1, 1000)` | Razorpay HMAC signature |

### 5.3 `CreateRefundDto`

| Field | Validator | Description |
|---|---|---|
| `paymentId` | `@IsUUID()` | ID of the payment to refund |
| `amount` | `@IsNumber`, `@Min(0.01)`, `@Max(99999999.99)` | Refund amount (must not exceed refundable balance) |
| `reason` | `@IsOptional`, `@IsString` | Free-text refund reason |

### 5.4 `PaymentResponseDto`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Payment UUID |
| `orderId` | `string` | Linked order UUID |
| `paymentMethod` | `PaymentMethod` | `ONLINE` or `COD` |
| `gateway` | `PaymentGateway` | `RAZORPAY` or `CASH` |
| `paymentStatus` | `PaymentStatus` | `PENDING`, `PAID`, `PARTIALLY_REFUNDED`, `REFUNDED`, `FAILED` |
| `payableAmount` | `number` | Total amount due (from `order.totalAmount`) |
| `currency` | `string` | Always `INR` |
| `paidAt` | `Date or null` | Timestamp when payment was confirmed |
| `createdAt` | `Date` | Record creation timestamp |
| `updatedAt` | `Date` | Last update timestamp |

---

## 6. Types

### `PAYMENT_WITH_TRANSACTIONS_INCLUDE`

Typed `Prisma.PaymentInclude` constant used consistently across all service queries:

```typescript
{
  transactions: {
    orderBy: { createdAt: 'desc' }
  }
}
```

### `PaymentWithTransactions`

Derived `Prisma.PaymentGetPayload` type scoped to the include above — used as the mapper's input type.

---

## 7. Mapper

### `PaymentsMapper` (static class)

```typescript
static toResponse(payment: Payment | PaymentWithTransactions): PaymentResponseDto
```

Maps the Prisma entity to the response DTO. `payableAmount` is cast from `Prisma.Decimal` to `number` via `Number()`.

---

## 8. Service Logic

### 8.1 `create(userId, orderId, dto)`

Runs inside a `$transaction`.

1. Looks up the `Order` by `{ id: orderId, userId, deletedAt: null }`. Throws `NotFoundException` if absent.
2. Rejects the request with `ConflictException` if `order.status` is `CANCELLED` or `FAILED`.
3. Checks for an existing `Payment` on the same `orderId`. Throws `ConflictException('Payment already exists for this order')` if found.
4. Derives the `gateway`:
   - `paymentMethod === COD` maps to `PaymentGateway.CASH`
   - any other method maps to `PaymentGateway.RAZORPAY`
5. Creates the `Payment` with `paymentStatus: PENDING`, `payableAmount: order.totalAmount`, `paidAmount: 0`, `refundedAmount: 0`, `currency: 'INR'`.
6. Creates an initial `PaymentTransaction` with `transactionStatus: INITIATED` and `amount: order.totalAmount`. This represents the pending collection for COD, or the initiated gateway request for Razorpay.
7. Re-fetches the full payment with `PAYMENT_WITH_TRANSACTIONS_INCLUDE` and returns the mapped DTO.

Design note: COD payments start as `PENDING` — not `PAID`. The order is marked paid only when `markCodAsPaid` is called, to reflect actual cash collection.

---

### 8.2 `findByOrder(userId, orderId)`

Looks up a `Payment` where `{ orderId, order: { userId, deletedAt: null } }`. Throws `NotFoundException` if not found. Returns the mapped DTO.

---

### 8.3 `verifyRazorpayPayment(userId, paymentId, dto)`

Runs inside a `$transaction`.

1. Looks up the `Payment` scoped to the user (`order: { userId, deletedAt: null }`). Throws `NotFoundException` if absent.
2. Rejects with `BadRequestException('This payment does not use Razorpay')` if `payment.gateway !== RAZORPAY`.
3. If `paymentStatus === PAID` already, returns the existing DTO immediately (idempotent).
4. Finds the most recent `PaymentTransaction` for the payment that matches the `gatewayPaymentId` or has a null `gatewayPaymentId` — the `INITIATED` transaction created during `create`.
5. Updates the transaction's `gatewayOrderId`, `gatewayPaymentId`, `gatewaySignature`, and `gatewayResponse` fields with the Razorpay callback values.

Design note: Actual Razorpay HMAC signature verification and status transition to `PAID` is not performed here. That step requires the Razorpay secret key and will be completed when the Razorpay client library is configured. This method safely stores the raw callback data from the client for audit purposes.

---

### 8.4 `markCodAsPaid(userId, paymentId)`

Runs inside a `$transaction`.

1. Looks up the `Payment` scoped by `{ id: paymentId, paymentMethod: COD, order: { userId, deletedAt: null } }`. Throws `NotFoundException` if absent.
2. If `paymentStatus === PAID` already, returns immediately (idempotent).
3. Rejects with `ConflictException` if `paymentStatus` is not `PENDING` (e.g., cannot mark a failed payment as paid).
4. Updates `Payment` to `paymentStatus: PAID`, sets `paidAmount = payableAmount`, records `paidAt = new Date()`.
5. Creates a new `PaymentTransaction` with `transactionStatus: SUCCESS`, `processedAt: new Date()`.
6. Updates the linked `Order.paymentStatus` to `PAID`.
7. Re-fetches and returns the updated DTO.

---

### 8.5 `createRefund(userId, dto)`

Runs inside a `$transaction`.

1. Looks up the `Payment` by `{ id: dto.paymentId, order: { userId, deletedAt: null } }`. Throws `NotFoundException` if absent.
2. Rejects with `ConflictException('Only paid payments can be refunded')` if status is not `PAID` or `PARTIALLY_REFUNDED`.
3. Calculates `availableAmount = payment.paidAmount - payment.refundedAmount`.
4. Rejects with `BadRequestException('Refund amount exceeds the refundable amount')` if `dto.amount > availableAmount`.
5. Creates a `Refund` record with `refundStatus: PENDING`, `refundAmount: Prisma.Decimal(dto.amount)`, `refundReason: dto.reason`.
6. Returns a plain object: `id`, `paymentId`, `refundAmount` (number), `refundStatus`, `refundReason`, `gatewayRefundId`, `refundedAt`, `createdAt`.

Design note: The `Payment.refundedAmount` and `Payment.paymentStatus` are not updated here. That update will happen when the refund is confirmed by the gateway via a webhook — a future implementation step.

---

## 9. Error Reference

| Error | Condition |
|---|---|
| `NotFoundException('Order not found')` | Order UUID not found or does not belong to the user |
| `ConflictException('Payment cannot be created for this order')` | Order is in `CANCELLED` or `FAILED` status |
| `ConflictException('Payment already exists for this order')` | A payment record for this order already exists |
| `NotFoundException('Payment not found')` | Payment UUID not found or does not belong to the user |
| `BadRequestException('This payment does not use Razorpay')` | `verifyRazorpayPayment` called on a COD payment |
| `NotFoundException('Payment transaction not found')` | No matching Razorpay transaction found during verify |
| `ConflictException('COD payment cannot be marked paid from <status> status')` | `markCodAsPaid` called on a non-PENDING payment |
| `ConflictException('Only paid payments can be refunded')` | Refund requested for a non-PAID or non-PARTIALLY_REFUNDED payment |
| `BadRequestException('Refund amount exceeds the refundable amount')` | Refund amount exceeds paidAmount minus refundedAmount |

---

*End of Module -- Payments*

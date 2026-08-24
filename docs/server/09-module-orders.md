# Module — Orders

> [← Back to Server Index](./README.md)

---

## Purpose

The `OrdersModule` manages **order placement, retrieval, and customer cancellation** for the aasPass multi-vendor marketplace platform. It converts an active shopping cart into an immutable order record, snapshotting prices and delivery addresses, deducting inventory atomically with Optimistic Concurrency Control (OCC), and maintaining audit histories.

All routes are protected by `SupabaseAuthGuard`.

---

## Module Structure

```
src/modules/orders/
├── orders.module.ts
├── controllers/
│   └── orders.controller.ts
├── dto/
│   ├── create-order.dto.ts
│   ├── update-order-status.dto.ts
│   ├── cancel-order.dto.ts
│   ├── order-item-response.dto.ts
│   └── order-response.dto.ts
├── mappers/
│   └── orders.mapper.ts
├── services/
│   └── orders.service.ts
└── types/
    └── orders.types.ts
```

---

## Module Registration (`orders.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule`, `AuthModule` |
| **Controllers** | `OrdersController` |
| **Providers** | `OrdersService`, `OrdersMapper` |
| **Exports** | `OrdersService` |

`AuthModule` is imported to provide `SupabaseAuthGuard` and `@AuthenticatedUser()`. `OrdersService` is exported for cross-module business logic consumption.

---

## Prisma Type Utilities (`src/modules/orders/types/orders.types.ts`)

#### `ORDER_WITH_ITEMS_INCLUDE`

```typescript
export const ORDER_WITH_ITEMS_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' },
  },
} as const satisfies Prisma.OrderInclude;
```

#### `OrderWithItems`

```typescript
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof ORDER_WITH_ITEMS_INCLUDE;
}>;
```

Derived type for an `Order` record joined with its `OrderItem[]` array ordered by creation time ascending.

---

## Data Transfer Objects

### `CreateOrderDto` (`dto/create-order.dto.ts`)

| Field | Type | Validations | Notes |
|---|---|---|---|
| `addressId` | `string` | `@IsUUID()` | Delivery address UUID owned by the authenticated user |
| `fulfillmentType` | `FulfillmentType` | `@IsEnum(FulfillmentType)` | Enum: `DELIVERY` \| `PICKUP` |
| `notes` | `string` (optional) | `@IsOptional()`, `@IsString()`, `@Length(1, 1000)` | Delivery instructions / order notes |

### `CancelOrderDto` (`dto/cancel-order.dto.ts`)

| Field | Type | Validations | Notes |
|---|---|---|---|
| `reason` | `string` (optional) | `@IsOptional()`, `@IsString()`, `@Length(1, 500)` | Cancellation reason |

### `UpdateOrderStatusDto` (`dto/update-order-status.dto.ts`)

| Field | Type | Validations | Notes |
|---|---|---|---|
| `status` | `OrderStatus` | `@IsEnum(OrderStatus)` | Enum: `PENDING`, `CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `FAILED` |

### `OrderItemResponseDto` (`dto/order-item-response.dto.ts`)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Order item UUID |
| `orderId` | `string` | Associated order UUID |
| `storeProductId` | `string` | Store product UUID |
| `quantity` | `number` | Quantity ordered |
| `productNameSnapshot` | `string` | Snapshot of product name at purchase time |
| `unitSnapshot` | `string` | Snapshot of unit (symbol/value) at purchase time |
| `mrpSnapshot` | `number` | Snapshot of Maximum Retail Price |
| `sellingPriceSnapshot` | `number` | Snapshot of effective selling price |
| `gstRateSnapshot` | `number` | Snapshot of GST percentage |
| `subtotal` | `number` | `sellingPriceSnapshot * quantity` |
| `fulfillmentStatus` | `FulfillmentStatus` | Item status: `PENDING`, `CONFIRMED`, `REPLACED`, `CANCELLED`, `DELIVERED` |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last update timestamp |

### `OrderResponseDto` (`dto/order-response.dto.ts`)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Order UUID |
| `userId` | `string` | Customer user UUID |
| `storeId` | `string` | Vendor store UUID |
| `addressId` | `string` | Delivery address UUID |
| `orderNumber` | `string` | Human-readable tracking number (e.g. `ORD-LXYZ123-A4B5C6`) |
| `status` | `OrderStatus` | Overall order status |
| `paymentStatus` | `PaymentStatus` | Payment state (`PENDING`, `PAID`, `FAILED`, etc.) |
| `fulfillmentType` | `FulfillmentType` | `DELIVERY` \| `PICKUP` |
| `subtotal` | `number` | Sum of item subtotals |
| `discountAmount` | `number` | Discount amount applied |
| `taxAmount` | `number` | Calculated GST tax total |
| `deliveryFee` | `number` | Delivery charge based on store settings |
| `totalAmount` | `number` | `subtotal - discountAmount + taxAmount + deliveryFee` |
| `deliveryReceiverName` | `string` | Snapshot of receiver name |
| `deliveryPhone` | `string` | Snapshot of receiver contact number |
| `deliveryEmail` | `string \| null` | Snapshot of receiver email |
| `deliveryHouseNo` | `string` | Snapshot of house / flat number |
| `deliveryStreet` | `string` | Snapshot of street address |
| `deliveryArea` | `string` | Snapshot of locality / area |
| `deliveryLandmark` | `string \| null` | Snapshot of landmark |
| `deliveryCity` | `string` | Snapshot of city |
| `deliveryState` | `string` | Snapshot of state |
| `deliveryCountry` | `string` | Snapshot of country |
| `deliveryPincode` | `string` | Snapshot of postal code |
| `deliveryLatitude` | `number \| null` | Geolocation latitude |
| `deliveryLongitude` | `number \| null` | Geolocation longitude |
| `deliveryInstructions` | `string \| null` | Customer delivery notes |
| `placedAt` | `Date` | Timestamp when order was placed |
| `version` | `number` | OCC version token |
| `confirmedAt` | `Date \| null` | Merchant confirmation timestamp |
| `packedAt` | `Date \| null` | Packing completion timestamp |
| `outForDeliveryAt` | `Date \| null` | Dispatch timestamp |
| `deliveredAt` | `Date \| null` | Delivery completion timestamp |
| `cancelledAt` | `Date \| null` | Cancellation timestamp |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last update timestamp |
| `items` | `OrderItemResponseDto[]` | Array of order line items |

---

## Mappers (`src/modules/orders/mappers/orders.mapper.ts`)

`OrdersMapper` is a static transformation class:

- `toItemResponse(item: OrderItem): OrderItemResponseDto` — Maps Decimal fields (`mrpSnapshot`, `sellingPriceSnapshot`, `gstRateSnapshot`, `subtotal`) to JavaScript `number` via `Number(decimal)`.
- `toResponse(order: OrderWithItems): OrderResponseDto` — Maps full order payload including Decimals (`subtotal`, `discountAmount`, `taxAmount`, `deliveryFee`, `totalAmount`, `deliveryLatitude`, `deliveryLongitude`) and mapped `items[]`.

---

## Service (`src/modules/orders/services/orders.service.ts`)

### `create(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto>`

Executes order placement inside an interactive Prisma `$transaction`:

1. **Cart Lookup:** Finds active cart (`CartStatus.ACTIVE`, non-deleted, non-empty) for `userId`. Throws `BadRequestException` if missing or empty.
2. **Store Check:** Verifies associated store is active and non-deleted.
3. **Address Verification:** Validates delivery address belongs to user and is non-deleted.
4. **Delivery Settings Check:** Fetches `StoreDeliverySetting`:
   - If `fulfillmentType === DELIVERY` and `!isDeliveryAvailable`, throws `BadRequestException`.
   - If `fulfillmentType === PICKUP` and `!isPickupAvailable`, throws `BadRequestException`.
   - Checks `cart.subtotal >= minimumOrderAmount`.
5. **Product & Availability Validation:** Fetches all store products in cart. Ensures all products and master products are non-deleted and `availabilityStatus === 'AVAILABLE'`.
6. **Price & Tax Computation:** Computes `subtotal` and GST `taxAmount` for each item.
7. **Atomic Inventory Deduction (OCC):**
   - Iterates over cart items. If `trackInventory === true`, checks `inventory.stockQuantity >= requiredQuantity`.
   - Executes `updateMany` filtering by `id`, `version`, and `stockQuantity >= requiredQuantity`. Decrements `stockQuantity`, increments `version`, updates `lastStockUpdate`. Throws `ConflictException` if concurrent stock modification occurs.
   - Appends `InventoryTransaction` (`transactionType: SALE`, `referenceType: ORDER`, `source: 'ORDER_PLACEMENT'`).
8. **Delivery Fee Calculation:** Calculates `deliveryFee` based on `freeDeliveryAbove` threshold and `deliveryCharge`.
9. **Order Number Generation:** Generates unique `orderNumber` via `ORD-${timestamp}-${random}` with uniqueness retry.
10. **Order Creation:** Creates `Order` with full 13-field delivery address snapshot, `OrderItem` snapshots, and initial `OrderStatusHistory` entry (`newStatus: PENDING`).
11. **Cart Status Update:** Updates `Cart.status = CartStatus.CHECKED_OUT`.
12. Returns formatted `OrderResponseDto`.

---

### `findAll(userId: string): Promise<OrderResponseDto[]>`

Retrieves all non-deleted orders placed by the user, ordered by `placedAt desc`, with items included.

---

### `findOne(userId: string, orderId: string): Promise<OrderResponseDto>`

Retrieves a single order by ID for the user with items included. Throws `NotFoundException` if not found.

---

### `cancel(userId: string, orderId: string, reason?: string): Promise<OrderResponseDto>`

Cancels an order inside an interactive Prisma `$transaction`:

1. Finds order scoped by `userId` and `deletedAt: null`.
2. Validates order status is in cancellable state (`PENDING`, `CONFIRMED`, `PREPARING`). Throws `ConflictException` if in un-cancellable state.
3. **Inventory Restoration:** Iterates through order items. For products with `trackInventory === true`, increments `stockQuantity` via `updateMany` OCC, increments `version`, and appends `InventoryTransaction` (`transactionType: RETURN`, `referenceType: ORDER`, `referenceId: order.id`, `source: 'ORDER_CANCELLATION'`).
4. **Order Status Update:** Updates `Order` status to `CANCELLED`, sets `cancelledAt: new Date()`, increments `version`, and appends `OrderStatusHistory` entry.
5. Returns updated `OrderResponseDto`.

---

## Endpoints

All endpoints are hosted at `/orders` and protected by `SupabaseAuthGuard`.

### `POST /orders`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateOrderDto` |
| **Response** | `OrderResponseDto` (201 Created) |

Places a new order from the user's active cart.

**Request Body:**
```json
{
  "addressId": "d3b07384-d113-4608-ad07-28d8b9487c53",
  "fulfillmentType": "DELIVERY",
  "notes": "Please leave at front door"
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure; active cart empty/missing; delivery/pickup unavailable; subtotal below minimum |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Delivery address not found |
| `409 Conflict` | Product unavailable; insufficient stock; concurrent stock modification |

---

### `GET /orders`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `OrderResponseDto[]` |

Retrieves all orders placed by the user, newest first.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |

---

### `GET /orders/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — Order UUID |
| **Response** | `OrderResponseDto` |

Retrieves a single order by ID.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Order not found or belongs to another user |

---

### `POST /orders/:id/cancel`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — Order UUID |
| **Request Body** | `CancelOrderDto` |
| **Response** | `OrderResponseDto` |

Cancels an order and restores inventory stock.

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Order not found or belongs to another user |
| `409 Conflict` | Order is in non-cancellable status (e.g. `OUT_FOR_DELIVERY`, `DELIVERED`) |

---

*End of Module — Orders*

# Mobile — Domain Models

> [← Back to Mobile Index](./README.md)

---

## Purpose

`src/model.ts` contains all core TypeScript types and pure (side-effect-free) business logic helpers. It has no dependencies on React, React Native, or any API layer — it is safe to import from anywhere.

---

## 1. Categories

```typescript
export type Category = string;
```

Category is an open string type. The app ships with a fixed set of display categories, each with a background and text colour token pair:

| Category | Colour Key |
|---|---|
| Fruits & Veggies | `freshSoft` / `freshText` |
| Dairy | `dairySoft` / `dairyText` |
| Bakery | `dailySoft` / `dailyText` |
| Snacks | `snackSoft` / `snackText` |
| Beverages | `bevSoft` / `bevText` |
| Personal Care | `careSoft` / `careText` |
| Household | `homeSoft` / `homeText` |
| Health | `healthSoft` / `healthText` |

---

## 2. Store

### `Store` type

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique store identifier |
| `name` | `string` | Store display name |
| `featured` | `boolean?` | Whether the store is featured on the home screen |
| `kind` | `string?` | Store category (e.g., "Grocery", "Pharmacy") |
| `distanceKm` | `number?` | Distance from user's location |
| `rating` | `number?` | Average rating |
| `minOrder` | `number` | Minimum order value (₹) |
| `deliveryFee` | `number` | Flat delivery fee (₹) |
| `freeDeliveryAbove` | `number?` | Order value above which delivery is free |
| `note` | `string?` | Store promotional note |
| `open` | `boolean` | Whether the store is currently set as open |
| `openTime` | `string?` | Opening time (HH:MM format) |
| `closeTime` | `string?` | Closing time (HH:MM format) |
| `supportsPickup` | `boolean` | Whether the store offers pickup |
| `phone` | `string` | Store contact phone number |

### `StoreHoursStatus` type

```typescript
type StoreHoursStatus = { open: boolean; label: string };
```

### `getStoreHoursStatus(store, now?): StoreHoursStatus`

Computes a live open/closed status and human-readable label from the store's `openTime` and `closeTime`. Uses `now` (defaults to `new Date()`) to determine if the store is currently open.

| Scenario | Label |
|---|---|
| Store open, within hours | `"Open · Closes at HH:MM AM/PM"` |
| Store closed, opens later today | `"Closed · Opens at HH:MM AM/PM"` |
| Store closed, opens next day | `"Closed · Opens tomorrow at HH:MM AM/PM"` |
| No hours configured | `"Open now"` or `"Closed"` based on `store.open` |

---

## 3. Products & Stock

### `Product` type

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique store-product identifier |
| `storeId` | `string` | The store this listing belongs to |
| `name` | `string` | Product display name |
| `brand` | `string` | Brand name |
| `category` | `Category` | Product category |
| `unit` | `string` | Unit of measure (e.g., "500g", "1L") |
| `description` | `string` | Product description |
| `price` | `number` | Selling price (₹) |
| `mrp` | `number` | Maximum retail price (₹) |
| `image` | `string?` | Image URL |
| `stockQty` | `number` | Units currently in stock — maps to inventory quantity |

### Constants

| Constant | Value | Description |
|---|---|---|
| `MAX_PRODUCT_QUANTITY` | `5` | Maximum units of any product per cart |
| `LOW_STOCK_THRESHOLD` | `5` | At or below this quantity, an "Only N left" label is shown |

### `StockStatus` type

```typescript
type StockStatus = { available: boolean; low: boolean; quantity: number; label: string };
```

### `getStockStatus(product): StockStatus`

| Scenario | `available` | `low` | Label |
|---|---|---|---|
| `stockQty === 0` | `false` | `false` | `"Out of stock"` |
| `stockQty <= LOW_STOCK_THRESHOLD` | `true` | `true` | `"Only N left"` |
| `stockQty > LOW_STOCK_THRESHOLD` | `true` | `false` | `"In stock"` |

### `isInStock(product): boolean`

Returns `getStockStatus(product).available`.

---

## 4. Addresses & Sessions

### `Address` type

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Address identifier |
| `label` | `string` | User-assigned label (e.g., "Home", "Office") |
| `line1` | `string` | Street address line 1 |
| `line2` | `string` | Street address line 2 |
| `city` | `string` | City |
| `state` | `string` | State |
| `pincode` | `string` | Postal code |

### `Session` type

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Session identifier |
| `device` | `string` | Device name / browser |
| `platform` | `string` | Platform (iOS, Android, Web) |
| `location` | `string` | Location derived from IP |
| `lastActive` | `string` | ISO timestamp of last activity |
| `current` | `boolean` | Whether this is the current device's session |

---

## 5. Cart & Orders

### `CartLine` type

```typescript
type CartLine = { productId: string; quantity: number };
```

### `OrderStatus` type

```typescript
type OrderStatus =
  | "PENDING" | "CONFIRMED" | "PREPARING"
  | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY"
  | "DELIVERED" | "CANCELLED" | "FAILED";
```

### `isOrderCancellable(status): boolean`

Returns `true` for `PENDING`, `CONFIRMED`, or `PREPARING` statuses.

### `OrderLineSnapshot` type

A price-snapshotted order line item from the backend:

```typescript
type OrderLineSnapshot = { name: string; unit: string; quantity: number; price: number };
```

### `DemoOrder` type

The primary client-side order model. Combines local demo state and live backend data.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Local order ID |
| `storeId` | `string` | Store the order was placed at |
| `items` | `CartLine[]` | Cart lines at order time |
| `total` | `number` | Order total (₹) |
| `status` | `OrderStatus` | Current order status |
| `placedAt` | `string` | ISO timestamp |
| `fulfilment` | `"delivery" \| "pickup"` | Fulfilment method |
| `deliveryInstructions` | `string?` | Customer delivery instructions |
| `deliveryPin` | `string?` | Delivery confirmation PIN |
| `customerNote` | `string?` | Customer note |
| `payment` | `OrderPayment?` | Associated payment record |
| `replacements` | `OrderItemReplacement[]` | Merchant-initiated item replacements |
| `serverId` | `string?` | Backend order UUID |
| `orderNumber` | `string?` | Human-readable tracking number |
| `statusLabel` | `string?` | Backend status string |
| `lines` | `OrderLineSnapshot[]?` | Backend price snapshots |
| `subtotal` | `number?` | Subtotal before fees |
| `discountAmount` | `number?` | Applied discount |
| `taxAmount` | `number?` | Applied tax |
| `deliveryFee` | `number?` | Delivery charge |

---

## 6. Utilities

### `formatMoney(amount): string`

Formats a number as Indian Rupee currency:

```typescript
formatMoney(1234.5)  // → "₹1,234.50"
```

Uses `toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.

---

*End of Domain Models*

# Module — Inventory

> [← Back to Server Index](./README.md)

---

## Purpose

The `InventoryModule` manages the **stock tracking layer** for store product listings. Each `StoreProduct` with `trackInventory = true` has exactly one `Inventory` record. The module exposes endpoints for initialising inventory, querying stock levels, adjusting stock, and reading the full transaction ledger.

Stock adjustments use **Optimistic Concurrency Control (OCC)** — the caller must supply the current `version` number. If the record was modified by another request between read and write, the transaction fails with a conflict error.

All routes are scoped to the authenticated user's **own store** and are protected by `SupabaseAuthGuard`.

---

## Module Structure

```
src/modules/inventory/
├── inventory.module.ts
├── controllers/
│ └── inventory.controller.ts
├── dto/
│ ├── create-inventory.dto.ts
│ ├── update-inventory.dto.ts
│ ├── adjust-inventory.dto.ts
│ ├── inventory-response.dto.ts
│ └── inventory-transaction-response.dto.ts
├── mappers/
│ └── inventory.mapper.ts
├── services/
│ └── inventory.service.ts
└── types/
 └── inventory.types.ts
```

---

## Module Registration (`inventory.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule`, `AuthModule` |
| **Controllers** | `InventoryController` |
| **Providers** | `InventoryService`, `InventoryMapper` |
| **Exports** | `InventoryService` |

`AuthModule` is imported to provide `SupabaseAuthGuard` and the `@AuthenticatedUser()` decorator. `InventoryService` is exported for potential future use by other modules (e.g., an order module that needs to decrement stock).

---

## Prisma Type Utilities (`src/modules/inventory/types/inventory.types.ts`)

#### `INVENTORY_WITH_TRANSACTIONS_INCLUDE`

```typescript
export const INVENTORY_WITH_TRANSACTIONS_INCLUDE = {
 transactions: {
 orderBy: { createdAt: 'desc' },
 },
} as const satisfies Prisma.InventoryInclude;
```

#### `InventoryWithTransactions`

```typescript
export type InventoryWithTransactions = Prisma.InventoryGetPayload<{
 include: typeof INVENTORY_WITH_TRANSACTIONS_INCLUDE;
}>;
```

Derived type for an `Inventory` record joined with its `InventoryTransaction[]` array, ordered newest-first.

---

## Data Transfer Objects

### `CreateInventoryDto` (`dto/create-inventory.dto.ts`)

| Field | Type | Validations | Default |
|---|---|---|---|
| `storeProductId` | `string` | `@IsUUID` | — |
| `stockQuantity` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(0)` | `0` |
| `reservedQuantity` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(0)` | `0` |
| `lowStockThreshold` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(0)` | `10` |
| `reorderLevel` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(0)` | `20` |

### `UpdateInventoryDto` (`dto/update-inventory.dto.ts`)

Updates only the threshold/reorder settings — stock levels are mutated exclusively via `adjustStock`.

| Field | Type | Validations |
|---|---|---|
| `lowStockThreshold` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(0)` |
| `reorderLevel` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(0)` |

### `AdjustInventoryDto` (`dto/adjust-inventory.dto.ts`)

| Field | Type | Validations | Notes |
|---|---|---|---|
| `transactionType` | `InventoryTransactionType` | `@IsEnum(InventoryTransactionType)` | Determines sign of delta |
| `quantity` | `number` | `@IsInt`, `@Min(1)` | Always positive; sign applied by `getQuantityDelta` |
| `referenceType` | `InventoryReferenceType` (optional) | `@IsOptional`, `@IsEnum` | Defaults to `MANUAL` |
| `referenceId` | `string` (optional) | `@IsOptional`, `@IsString` | Polymorphic FK (e.g. order UUID) |
| `source` | `string` (optional) | `@IsOptional`, `@IsString` | Free-text origin label |
| `notes` | `string` (optional) | `@IsOptional`, `@IsString` | Human-readable note |
| `expectedVersion` | `number` | `@IsInt`, `@Min(0)` | OCC version — must match current `inventory.version` |

### `InventoryResponseDto` (`dto/inventory-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `storeProductId` | `string` | UUID |
| `stockQuantity` | `number` | Current on-hand stock |
| `reservedQuantity` | `number` | Stock reserved for pending orders |
| `lowStockThreshold` | `number` | Alert threshold |
| `reorderLevel` | `number` | Suggested reorder trigger |
| `version` | `number` | OCC version counter; incremented on every write |
| `lastStockUpdate` | `Date or null` | Timestamp of last stock-level change; `null` until first adjustment |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

### `InventoryTransactionResponseDto` (`dto/inventory-transaction-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `inventoryId` | `string` | UUID of the parent inventory record |
| `transactionType` | `InventoryTransactionType` | |
| `quantity` | `number` | Absolute quantity (always positive) |
| `balanceAfterTransaction` | `number` | Snapshot of `stockQuantity` after this transaction |
| `referenceType` | `InventoryReferenceType or null` | |
| `referenceId` | `string or null` | |
| `source` | `string or null` | |
| `notes` | `string or null` | |
| `createdBy` | `string or null` | User ID of actor |
| `createdAt` | `Date` | Transactions are append-only — no `updatedAt` |

---

## Mapper (`src/modules/inventory/mappers/inventory.mapper.ts`)

A **static** class — all methods are called as `InventoryMapper.toResponse(...)`.

#### `static toResponse(inventory: Inventory): InventoryResponseDto`

Direct field mapping. No Decimal fields — all numeric values are plain integers.

#### `static toTransactionResponse(transaction: InventoryTransaction): InventoryTransactionResponseDto`

Direct field mapping for the transaction ledger entry.

---

## `InventoryService` (`src/modules/inventory/services/inventory.service.ts`)

Injected dependency: `PrismaService`.

All queries scope to the authenticated user's store via a nested `store: { ownerId: userId, deletedAt: null }` filter on the related `StoreProduct`.

### `create(userId: string, dto: CreateInventoryDto): Promise<InventoryResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `prisma.storeProduct.findFirst({ ..., include: { inventory: true } })` scoped by store ownership | `NotFoundException('Store product not found')` |
| 2 | Check `storeProduct.trackInventory === true` | `ConflictException('Inventory tracking is disabled for this store product')` |
| 3 | Check `storeProduct.inventory === null` | `ConflictException('Inventory already exists for this store product')` |
| 4 | Validate `reservedQuantity <= stockQuantity` | `ConflictException('Reserved quantity cannot exceed stock quantity')` |
| 5 | Validate `reorderLevel >= lowStockThreshold` | `ConflictException('Reorder level cannot be lower than low stock threshold')` |
| 6 | `$transaction`: create `Inventory` (`version: 0`); if `stockQuantity > 0`, create initial `InventoryTransaction` (`RESTOCK`, `source: 'inventory.create'`, `notes: 'Initial inventory stock'`) | — |
| catch | P2002 → `ConflictException('Inventory already exists for this store product')` | — |

> **Initial transaction:** When `stockQuantity > 0`, an opening `RESTOCK` ledger entry is created in the same transaction to ensure the ledger is never empty when stock is present.

### `findAll(userId: string): Promise<InventoryResponseDto[]>`

Returns all inventory records for all store products owned by the user's store, ordered by `createdAt desc`.

### `findOne(userId: string, inventoryId: string): Promise<InventoryResponseDto>`

Returns a single inventory record scoped by store ownership. Throws `NotFoundException('Inventory not found')` if absent or belonging to a different store.

### `update(userId: string, inventoryId: string, dto: UpdateInventoryDto): Promise<InventoryResponseDto>`

Updates `lowStockThreshold` and/or `reorderLevel`. Merges dto values with existing values before validation.

| Step | Action | Error |
|---|---|---|
| 1 | `findOwnedInventory(userId, inventoryId)` | `NotFoundException` |
| 2 | Compute effective `lowStockThreshold` / `reorderLevel` (dto or existing) | — |
| 3 | Validate `reorderLevel >= lowStockThreshold` | `ConflictException('Reorder level cannot be lower than low stock threshold')` |
| 4 | `prisma.inventory.update(...)` — increments `version` via `{ increment: 1 }` | — |

### `adjustStock(userId: string, inventoryId: string, dto: AdjustInventoryDto): Promise<InventoryResponseDto>`

The core OCC stock mutation method.

| Step | Action | Error |
|---|---|---|
| 1 | `findOwnedInventory(userId, inventoryId)` | `NotFoundException` |
| 2 | `inventory.version !== dto.expectedVersion` | `ConflictException('Inventory was modified by another request. Refresh and try again.')` |
| 3 | `getQuantityDelta(dto)` — derives signed delta from `transactionType` | `ConflictException` for `ADJUSTMENT` or unknown types |
| 4 | Compute `newStockQuantity = inventory.stockQuantity + quantityDelta` | — |
| 5 | `newStockQuantity < 0` | `ConflictException('Stock quantity cannot become negative')` |
| 6 | `inventory.reservedQuantity > newStockQuantity` | `ConflictException('Stock quantity cannot be lower than reserved quantity')` |
| 7 | `$transaction`: `updateMany` with `version = dto.expectedVersion` where clause (in-DB OCC); if `count !== 1` throw conflict; create `InventoryTransaction`; re-fetch with `findUniqueOrThrow` | `ConflictException` if concurrent write wins |

> **Double OCC check:** Version is verified both in application code (step 2, fast-fail) and inside the Prisma transaction's `updateMany` `where` clause (step 7, race-safe). The `updateMany` filter eliminates the race window between the application-level read and the DB write.

### `getTransactions(userId: string, inventoryId: string): Promise<InventoryTransactionResponseDto[]>`

| Step | Action |
|---|---|
| 1 | `findOwnedInventory(userId, inventoryId)` — ownership scope check |
| 2 | `prisma.inventoryTransaction.findMany({ where: { inventoryId }, orderBy: { createdAt: 'desc' } })` |

### Private Helpers

| Method | Purpose |
|---|---|
| `findOwnedInventory(userId, inventoryId)` | `prisma.inventory.findFirst` with nested `store: { ownerId: userId, deletedAt: null }` scope; throws `NotFoundException('Inventory not found')` |
| `getQuantityDelta(dto)` | `PURCHASE`/`RESTOCK`/`RETURN` +quantity; `SALE`/`DAMAGE`/`EXPIRED` -quantity; `ADJUSTMENT` throws `ConflictException`; unknown throws `ConflictException` |

---

## Inventory Endpoints

All endpoints are under controller prefix `inventory/me` with class-level `SupabaseAuthGuard`.

---

### `POST /inventory/me`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateInventoryDto` |
| **Response** | `InventoryResponseDto` |

Creates an inventory record for a store product. Guards: store ownership, `trackInventory = true`, no pre-existing inventory, `reservedQuantity <= stockQuantity`, `reorderLevel >= lowStockThreshold`. An opening `RESTOCK` ledger entry is created if `stockQuantity > 0`.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Store product not found or not owned by the user's store |
| `409 Conflict` | `trackInventory = false`; inventory already exists; `reservedQuantity > stockQuantity`; `reorderLevel < lowStockThreshold` |

---

### `GET /inventory/me`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `InventoryResponseDto[]` |

Returns all inventory records for the current user's store, ordered by `createdAt desc`.

---

### `GET /inventory/me/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the inventory record |
| **Response** | `InventoryResponseDto` |

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Inventory not found or belongs to a different store |

---

### `PATCH /inventory/me/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the inventory record |
| **Request Body** | `UpdateInventoryDto` |
| **Response** | `InventoryResponseDto` (updated) |

Updates `lowStockThreshold` and/or `reorderLevel`. Validates `reorderLevel >= lowStockThreshold` against effective merged values. Increments `version`.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Inventory not found or belongs to a different store |
| `409 Conflict` | `reorderLevel < lowStockThreshold` (effective merged values) |

---

### `POST /inventory/me/:id/adjust`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the inventory record |
| **Request Body** | `AdjustInventoryDto` |
| **Response** | `InventoryResponseDto` (updated) |

Applies a signed stock delta inside a database transaction with OCC version locking. Appends an immutable `InventoryTransaction` ledger entry. The `quantity` field is always a positive integer; the sign is determined by `transactionType`.

**Transaction type to stock delta mapping:**

| `transactionType` | Delta |
|---|---|
| `PURCHASE` | +quantity |
| `RESTOCK` | +quantity |
| `RETURN` | +quantity |
| `SALE` | -quantity |
| `DAMAGE` | -quantity |
| `EXPIRED` | -quantity |
| `ADJUSTMENT` | Not allowed via this endpoint |

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Inventory not found or belongs to a different store |
| `409 Conflict` | `expectedVersion` mismatch (OCC); `newStockQuantity < 0`; `newStockQuantity < reservedQuantity`; `ADJUSTMENT` type used |

---

### `GET /inventory/me/:id/transactions`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the inventory record |
| **Response** | `InventoryTransactionResponseDto[]` |

Returns the full append-only transaction ledger for the specified inventory, ordered by `createdAt desc`.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Inventory not found or belongs to a different store |

---

*End of Module — Inventory*


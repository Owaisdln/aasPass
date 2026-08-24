# Module — Wishlist

> [← Back to Server Index](./README.md)

---

## Purpose

The `WishlistModule` manages **named bookmark lists** that users create to save products they are interested in. Each user can have multiple wishlists; one can be marked as the default. Items are linked to `StoreProduct` records and are only addable if the product and its store are active.

All routes are protected by `SupabaseAuthGuard`.

---

## Module Structure

```
src/modules/wishlist/
├── wishlist.module.ts
├── controllers/
│ └── wishlist.controller.ts
├── dto/
│ ├── create-wishlist.dto.ts
│ ├── update-wishlist.dto.ts
│ ├── add-wishlist-item.dto.ts
│ ├── wishlist-item-response.dto.ts
│ └── wishlist-response.dto.ts
├── mappers/
│ └── wishlist.mapper.ts
├── services/
│ └── wishlist.service.ts
└── types/
 └── wishlist.types.ts
```

---

## Module Registration (`wishlist.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule`, `AuthModule` |
| **Controllers** | `WishlistController` |
| **Providers** | `WishlistService`, `WishlistMapper` |
| **Exports** | `WishlistService` |

`AuthModule` is imported to provide `SupabaseAuthGuard` and the `@AuthenticatedUser()` decorator. `WishlistService` is exported for future module consumption.

---

## Prisma Type Utilities (`src/modules/wishlist/types/wishlist.types.ts`)

#### `WISHLIST_WITH_ITEMS_INCLUDE`

```typescript
export const WISHLIST_WITH_ITEMS_INCLUDE = {
 items: {
 orderBy: { createdAt: 'desc' },
 },
} as const satisfies Prisma.WishlistInclude;
```

#### `WishlistWithItems`

```typescript
export type WishlistWithItems = Prisma.WishlistGetPayload<{
 include: typeof WISHLIST_WITH_ITEMS_INCLUDE;
}>;
```

Derived type for a `Wishlist` record joined with its `WishlistItem[]` array, ordered newest-first.

---

## Data Transfer Objects

### `CreateWishlistDto` (`dto/create-wishlist.dto.ts`)

| Field | Type | Validations | Notes |
|---|---|---|---|
| `name` | `string` | `@IsString`, `@Length(1, 100)` | Trimmed in service before persist |
| `isDefault` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` | If `true`, existing default is demoted in a transaction |

### `UpdateWishlistDto` (`dto/update-wishlist.dto.ts`)

| Field | Type | Validations | Notes |
|---|---|---|---|
| `name` | `string` | `@IsString`, `@Length(1, 100)` | Required — only the name is updatable |

> Only the wishlist name is updatable via this DTO. To change the default flag, use `PATCH /wishlists/:id/default`.

### `AddWishlistItemDto` (`dto/add-wishlist-item.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `storeProductId` | `string` | `@IsUUID` |

### `WishlistItemResponseDto` (`dto/wishlist-item-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `wishlistId` | `string` | UUID of the parent wishlist |
| `storeProductId` | `string` | UUID of the saved store product |
| `createdBy` | `string or null` | User ID of the actor |
| `createdAt` | `Date` | Items are append-only — no `updatedAt` |

### `WishlistResponseDto` (`dto/wishlist-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `userId` | `string` | UUID of the owning user |
| `name` | `string` | |
| `isDefault` | `boolean` | |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |
| `items` | `WishlistItemResponseDto[]` | Empty array when using `toBasicResponse` |

---

## Mapper (`src/modules/wishlist/mappers/wishlist.mapper.ts`)

A **static** class — all methods are called as `WishlistMapper.toResponse(...)`.

#### `static toItemResponse(item: WishlistItem): WishlistItemResponseDto`

Direct field mapping for a single wishlist item.

#### `static toResponse(wishlist: WishlistWithItems): WishlistResponseDto`

Maps a wishlist with its full `items` array. Delegates to `toItemResponse` for each item.

#### `static toBasicResponse(wishlist: Wishlist): WishlistResponseDto`

Maps a plain `Wishlist` record (no join) with `items: []`. Used when returning after a delete or setDefault operation where the items are not needed.

---

## `WishlistService` (`src/modules/wishlist/services/wishlist.service.ts`)

Injected dependency: `PrismaService`.

All queries scope to `userId` and filter `deletedAt: null` on wishlists.

### `create(userId: string, dto: CreateWishlistDto): Promise<WishlistResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | Trim `name`; throw if empty after trim | `ConflictException('Wishlist name cannot be empty')` |
| 2 | `$transaction`: if `dto.isDefault === true`, `updateMany` all existing defaults to `isDefault: false` | — |
| 3 | `tx.wishlist.create(...)` with `WISHLIST_WITH_ITEMS_INCLUDE` | — |
| catch | P2002 → `ConflictException('A wishlist with this name already exists')` | — |

> The `@@unique([userId, name])` constraint on the `Wishlist` model prevents duplicate-named wishlists per user.

### `findAll(userId: string): Promise<WishlistResponseDto[]>`

Returns all non-deleted wishlists with their items, ordered by `isDefault desc, createdAt asc` (default wishlist always first).

### `findOne(userId: string, wishlistId: string): Promise<WishlistResponseDto>`

Returns a single wishlist via `findOwnedWishlist`. Includes items.

### `update(userId: string, wishlistId: string, dto: UpdateWishlistDto): Promise<WishlistResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `findOwnedWishlist(userId, wishlistId)` | `NotFoundException` |
| 2 | Trim `name`; throw if empty | `ConflictException` |
| 3 | `prisma.wishlist.update(...)` with `WISHLIST_WITH_ITEMS_INCLUDE` | — |
| catch | P2002 → `ConflictException('A wishlist with this name already exists')` | — |

### `setDefault(userId: string, wishlistId: string): Promise<WishlistResponseDto>`

| Step | Action |
|---|---|
| 1 | `findOwnedWishlist(userId, wishlistId)` — verify ownership |
| 2 | `$transaction`: `updateMany` all existing defaults for user to `isDefault: false` |
| 3 | `tx.wishlist.update(...)` sets `isDefault: true` with `WISHLIST_WITH_ITEMS_INCLUDE` |

### `remove(userId: string, wishlistId: string): Promise<void>`

| Step | Action | Error |
|---|---|---|
| 1 | `findOwnedWishlist(userId, wishlistId)` | `NotFoundException` |
| 2 | Guard: `wishlist.isDefault === true` | `ConflictException('The default wishlist cannot be deleted')` |
| 3 | `prisma.wishlist.update(...)` — sets `deletedAt = new Date()`, `isDefault = false` | — |

> The default wishlist cannot be deleted. To delete it, first set another wishlist as default.

### `addItem(userId: string, wishlistId: string, dto: AddWishlistItemDto): Promise<WishlistItemResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `findOwnedWishlist(userId, wishlistId)` | `NotFoundException` |
| 2 | `prisma.storeProduct.findFirst(...)` — validates `deletedAt: null`, `availabilityStatus: { not: 'DISCONTINUED' }`, `store.status: ACTIVE`, `masterProduct.status: ACTIVE` | `NotFoundException('Store product not found or unavailable')` |
| 3 | `prisma.wishlistItem.create(...)` | — |
| catch | P2002 → `ConflictException('Product is already in this wishlist')` | — |

> Only products in **active** stores with an **active** master product and a non-discontinued `availabilityStatus` can be added.

### `removeItem(userId: string, wishlistId: string, itemId: string): Promise<void>`

| Step | Action | Error |
|---|---|---|
| 1 | `findOwnedWishlist(userId, wishlistId)` | `NotFoundException` |
| 2 | `prisma.wishlistItem.findFirst({ where: { id: itemId, wishlistId } })` | `NotFoundException('Wishlist item not found')` |
| 3 | `prisma.wishlistItem.delete({ where: { id: item.id } })` | — |

**Hard-delete** — wishlist items are permanently removed.

### `clear(userId: string, wishlistId: string): Promise<void>`

| Step | Action |
|---|---|
| 1 | `findOwnedWishlist(userId, wishlistId)` |
| 2 | `prisma.wishlistItem.deleteMany({ where: { wishlistId } })` |

**Hard-delete** — removes all items from the wishlist permanently.

### Private Helpers

| Method | Purpose |
|---|---|
| `findOwnedWishlist(userId, wishlistId)` | `prisma.wishlist.findFirst({ where: { id: wishlistId, userId, deletedAt: null }, include: WISHLIST_WITH_ITEMS_INCLUDE })`; throws `NotFoundException('Wishlist not found')` |

---

## Wishlist Endpoints

All endpoints are under controller prefix `wishlists` with class-level `SupabaseAuthGuard`.

---

### `POST /wishlists`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateWishlistDto` |
| **Response** | `WishlistResponseDto` |

Creates a new wishlist. If `isDefault: true`, all existing default wishlists are demoted in a transaction before creation.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `409 Conflict` | Wishlist name already exists for this user; or name is empty after trim |

---

### `GET /wishlists`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `WishlistResponseDto[]` |

Returns all non-deleted wishlists with items, ordered `isDefault desc, createdAt asc`.

---

### `GET /wishlists/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the wishlist |
| **Response** | `WishlistResponseDto` |

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Wishlist not found, soft-deleted, or belongs to another user |

---

### `PATCH /wishlists/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the wishlist |
| **Request Body** | `UpdateWishlistDto` |
| **Response** | `WishlistResponseDto` (updated) |

Updates the wishlist name. Only the name can be changed via this endpoint.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Wishlist not found or belongs to another user |
| `409 Conflict` | Name already taken by another wishlist of this user |

---

### `PATCH /wishlists/:id/default`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the wishlist |
| **Response** | `WishlistResponseDto` (updated) |

Promotes the specified wishlist to default. Runs in a transaction: all other defaults are demoted, then this wishlist is set as default.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Wishlist not found or belongs to another user |

---

### `DELETE /wishlists/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the wishlist |
| **Response** | `204 No Content` (void) |

Soft-deletes the wishlist. The **default wishlist cannot be deleted** — promote another wishlist first.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Wishlist not found or belongs to another user |
| `409 Conflict` | Cannot delete the default wishlist |

---

### `POST /wishlists/:id/items`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the wishlist |
| **Request Body** | `AddWishlistItemDto` |
| **Response** | `WishlistItemResponseDto` |

Adds a store product to the wishlist. The product must belong to an active store, have an active master product, and must not have `DISCONTINUED` availability status.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Wishlist not found; or store product not found / unavailable |
| `409 Conflict` | Product already exists in this wishlist |

---

### `DELETE /wishlists/:id/items/:itemId`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Params** | `id` — wishlist UUID; `itemId` — wishlist item UUID |
| **Response** | `204 No Content` (void) |

Hard-deletes a single item from the wishlist.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Wishlist not found; or item not found in this wishlist |

---

### `DELETE /wishlists/:id/items`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the wishlist |
| **Response** | `204 No Content` (void) |

Hard-deletes **all** items from the wishlist (clear). The wishlist itself is not deleted.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Wishlist not found or belongs to another user |

---

*End of Module — Wishlist*


# Mobile — State Management

> [← Back to Mobile Index](./README.md)

---

## Purpose

The app uses **Zustand** for global client-side state (`src/store.ts`). It manages cart, orders, wishlist, account, sessions, addresses, and backend-sync status. All state mutations that hit the backend are handled inside store actions — screens call actions and read from state, never calling API functions directly.

---

## 1. `useAppStore` (`src/store.ts`)

The single Zustand store. Consumed by screens and components via `useAppStore(selector)`.

---

## 2. State Slices

### Cart

| Field / Action | Type | Description |
|---|---|---|
| `cart` | `CartLine[]` | Array of `{ productId, quantity }` for the active store |
| `cartStoreId` | `string \| null` | The store the current cart belongs to (single-store constraint) |
| `addToCart(productId, forceSwitch?)` | `Promise<AddToCartResult>` | Adds a product. Returns `"added"`, `"conflict"` (different store), `"quantity-limit"`, `"stock-limit"`, or `"unavailable"` |
| `setQuantity(productId, quantity)` | `void` | Sets quantity for a cart line (removes line if `quantity === 0`) |

**`AddToCartResult` values:**

| Value | Meaning |
|---|---|
| `added` | Successfully added or quantity incremented |
| `conflict` | Product belongs to a different store than the current cart |
| `quantity-limit` | Would exceed `MAX_PRODUCT_QUANTITY` (5) |
| `stock-limit` | Would exceed available `stockQty` |
| `unavailable` | Product is out of stock |

---

### Orders

| Field / Action | Type | Description |
|---|---|---|
| `orders` | `DemoOrder[]` | All orders (local + fetched from backend) |
| `placeOrder(fulfilment, deliveryInstructions?)` | `Promise<string \| null>` | Places an order via the backend API. Returns the server `orderId` or `null` on failure |
| `cancelOrder(orderId)` | `Promise<boolean>` | Cancels an order via the backend API. Restores inventory on success |
| `repeatOrder(orderId)` | `"added" \| "unavailable"` | Re-adds items from a past order to cart |
| `respondToReplacement(orderId, replacementId, accept)` | `void` | Accepts or rejects a merchant-initiated item replacement |
| `storeFeedback` | `Record<string, { rating, tags, comment }>` | Local feedback keyed by `orderId` |
| `submitStoreFeedback(orderId, rating, tags, comment)` | `void` | Stores feedback locally |
| `addOrderNote(orderId, note)` | `void` | Attaches a customer note to an order |

---

### Wishlist

| Field / Action | Type | Description |
|---|---|---|
| `wishlist` | `string[]` | Ordered list of product IDs in the wishlist |
| `wishlistItemIds` | `Record<string, string>` | Maps `productId → backend wishlist item UUID` (for deletion) |
| `wishlistId` | `string \| null` | Backend wishlist UUID of the default list |
| `wishlistSync` | `"local" \| "syncing" \| "synced" \| "error"` | Sync status |
| `toggleWishlist(productId)` | `void` | Adds or removes a product from the wishlist (optimistic) |
| `syncWishlist()` | `Promise<void>` | Fetches/creates the default wishlist from the backend and reconciles local state |
| `recentlyViewed` | `string[]` | Recently viewed product IDs (max 20, newest first) |
| `markViewed(productId)` | `void` | Prepends a product to `recentlyViewed` |

---

### Account

| Field / Action | Type | Description |
|---|---|---|
| `firstName` | `string` | User's first name |
| `lastName` | `string` | User's last name |
| `updateName(firstName, lastName)` | `void` | Updates name in local state (does not call API — use `PATCH /users/me` separately) |
| `email` | `string` | User's email address |
| `phone` | `string` | User's phone number |
| `addressId` | `string` | Currently selected delivery address ID |
| `addresses` | `Address[]` | All user addresses |
| `setAddressId(id)` | `void` | Sets the active delivery address |
| `addAddress(addressData)` | `Promise<string>` | Creates an address via the backend API. Returns the new address ID |
| `deleteAddress(addressId)` | `Promise<boolean>` | Deletes an address via the backend API |
| `sessions` | `Session[]` | List of signed-in device sessions |
| `revokeSession(sessionId)` | `boolean` | Removes a session locally (backend call is handled by `SessionsScreen`) |
| `revokeOtherSessions()` | `number` | Removes all sessions except the current one locally |

---

### Authentication

| Field / Action | Type | Description |
|---|---|---|
| `isSignedIn` | `boolean` | Whether the user has a valid session |
| `signIn(accessToken?)` | `Promise<void>` | Accepts an optional token override. Sets `accessToken`, fetches user profile, and syncs cart/orders/wishlist from backend |
| `signOut()` | `void` | Clears all auth state and resets cart, orders, wishlist |

---

### Backend Sync

| Field / Action | Type | Description |
|---|---|---|
| `sync` | `Record<SyncArea, SyncStatus>` | Per-area sync status (see below) |
| `bootstrap()` | `Promise<void>` | Restores the backend connection and Supabase session on app start |
| `refreshAccount()` | `Promise<void>` | Re-fetches profile, addresses, sessions, and orders |
| `syncProfile()` | `Promise<void>` | Fetches `GET /users/me` and updates account fields |
| `syncAddresses()` | `Promise<void>` | Fetches address list from backend |
| `syncCart()` | `Promise<void>` | Fetches backend cart and merges with local state |
| `syncSessions()` | `Promise<void>` | Fetches session list from `GET /users/me/sessions` |
| `syncOrders()` | `Promise<void>` | Fetches order list from `GET /orders` and merges with local orders |

#### `SyncArea` and `SyncStatus`

| `SyncArea` | `SyncStatus` values |
|---|---|
| `profile` | `"local"` \| `"syncing"` \| `"synced"` \| `"error"` |
| `sessions` | `"local"` \| `"syncing"` \| `"synced"` \| `"error"` |
| `orders` | `"local"` \| `"syncing"` \| `"synced"` \| `"error"` |
| `wishlist` | `"local"` \| `"syncing"` \| `"synced"` \| `"error"` |

---

## 3. Design Principles

- **Optimistic updates** — wishlist toggles, local order notes, and feedback are applied immediately; backend calls happen in the background.
- **Single-store cart** — the cart enforces a single active `cartStoreId`. Adding a product from a different store returns `"conflict"` without modifying state.
- **Backend fallback** — all sync actions gracefully degrade. If the backend is unreachable, local state remains usable.
- **Immutable reads** — state slices are plain values; actions use `set()` to produce the next state.

---

*End of State Management*

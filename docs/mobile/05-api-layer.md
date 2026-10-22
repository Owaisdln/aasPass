# Mobile — API Layer

> [← Back to Mobile Index](./README.md)

---

## Purpose

The `src/api/` directory contains the entire data access layer for the mobile app. It provides:

- A thin `fetch`-based HTTP client (`client.ts`)
- A runtime connection configuration system (`config.ts`)
- Supabase authentication (`auth.ts`)
- Domain-scoped API modules for each backend resource
- Response mappers from backend DTOs to client domain models

---

## 1. HTTP Client (`src/api/client.ts`)

A minimal, React Native-compatible HTTP client built on the browser `fetch` API. No third-party HTTP library is used.

### `apiFetch<T>(path, init?): Promise<T>`

The core fetch wrapper. All domain API functions call this.

| Behaviour | Detail |
|---|---|
| Base URL | Resolved from `getConnection().apiUrl` at call time |
| Auth header | `Authorization: Bearer <accessToken>` injected automatically if `accessToken` is set |
| Content-Type | Always `application/json` |
| 204 response | Returns `undefined as T` |
| Error response | Throws `ApiError(status, message)` with the server's `message` field |
| Network error | Throws `ApiError(0, ...)` with a hint to check the server is running and use LAN IP |

### `setApiAccessToken(token: string | null)`

Sets the module-level `accessToken` used by all subsequent `apiFetch` calls. Called by the auth layer whenever a Supabase session is obtained or revoked.

### `isBackendConfigured(): boolean`

Returns `true` when both the base URL and access token are set. Used by the store to gate backend API calls.

### `ApiError`

```typescript
class ApiError extends Error {
  status: number; // 0 = network error; HTTP status otherwise
}
```

---

## 2. Connection Configuration (`src/api/config.ts`)

Manages the backend connection settings (API URL and Supabase credentials). Settings are persisted to **Expo SecureStore** so they survive app restarts.

### `initConnection(): Promise<void>`

Loads stored settings from SecureStore on app startup. If no settings are stored, the app starts unconfigured.

### `getConnection(): ConnectionConfig`

Returns the current in-memory connection configuration:

| Field | Type | Description |
|---|---|---|
| `apiUrl` | `string` | NestJS backend base URL (e.g., `http://192.168.1.5:3000`) |
| `supabaseUrl` | `string` | Supabase project URL |
| `supabaseAnonKey` | `string` | Supabase anon/public key |

### `saveConnection(config): Promise<void>`

Persists a new connection configuration to SecureStore and updates the in-memory state.

### `isAuthConfigured(): boolean`

Returns `true` when both `supabaseUrl` and `supabaseAnonKey` are set.

---

## 3. Authentication (`src/api/auth.ts`)

Wraps Supabase JS Auth for React Native. The Supabase client is lazily instantiated and uses `AsyncStorage` for session persistence.

### Functions

| Function | Description |
|---|---|
| `getSupabase()` | Returns the singleton `SupabaseClient`, or `null` if auth is not configured |
| `resetSupabase()` | Clears the cached Supabase client (called when connection settings change) |
| `restoreSession()` | Re-hydrates a persisted session from AsyncStorage. Sets the access token |
| `signInWithPassword(email, password)` | Signs in with email + password. Sets the access token |
| `signUpWithPassword(email, password)` | Creates a new user + signs in |
| `sendPhoneOtp(phone)` | Sends an SMS OTP via Supabase (requires SMS provider to be enabled) |
| `verifyPhoneOtp(phone, token)` | Verifies an SMS OTP and creates a session |
| `sendEmailOtp(email)` | Sends a magic-link / email OTP |
| `verifyEmailOtp(email, token)` | Verifies an email OTP and creates a session |
| `signOutRemote()` | Signs out from Supabase and clears the access token |
| `getSessionUser()` | Returns the currently authenticated Supabase user |
| `listDemoUsers()` | `GET /auth/demo-users` — lists available demo accounts |
| `signInDemoUser(email)` | `POST /auth/demo-login` — signs in as a demo user (dev only) |

> Supabase client options: `persistSession: true`, `autoRefreshToken: true`, `storageKey: 'aaspass-auth'`, `detectSessionInUrl: false`

---

## 4. Domain API Modules

All functions call `apiFetch` with the appropriate path and method.

### Users (`src/api/users.ts`)

| Function | Method | Path | Description |
|---|---|---|---|
| `getMe()` | `GET` | `/users/me` | Returns the authenticated user profile |
| `updateMe(data)` | `PATCH` | `/users/me` | Updates `firstName` and/or `lastName` |
| `listMySessions()` | `GET` | `/users/me/sessions` | Returns all active sessions |
| `revokeMySession(sessionId)` | `DELETE` | `/users/me/sessions/:sessionId` | Revokes a specific session |
| `revokeAllMySessions()` | `DELETE` | `/users/me/sessions` | Revokes all active sessions |

### Stores (`src/api/stores.ts`)

| Function | Method | Path | Description |
|---|---|---|---|
| `listStores(lat?, lng?)` | `GET` | `/stores` | Lists stores (optionally filtered by location) |
| `getStore(storeId)` | `GET` | `/stores/:storeId` | Returns a single store |

### Catalog (`src/api/catalog.ts`)

| Function | Method | Path | Description |
|---|---|---|---|
| `listProducts(storeId)` | `GET` | `/catalog/store-products/me` | Lists store products |
| `getProduct(productId)` | `GET` | `/catalog/store-products/:productId` | Returns a single product |

### Cart (`src/api/carts.ts`)

| Function | Method | Path | Description |
|---|---|---|---|
| `getMyCart()` | `GET` | `/cart` | Returns the backend cart |
| `upsertCartItem(productId, quantity)` | `POST` | `/cart/items` | Adds or updates a cart line |
| `clearCart()` | `DELETE` | `/cart` | Clears the entire cart |

### Orders (`src/api/orders.ts`)

| Function | Method | Path | Description |
|---|---|---|---|
| `createOrder(data)` | `POST` | `/orders` | Places a new order |
| `listOrders()` | `GET` | `/orders` | Returns all orders (newest first) |
| `getOrder(orderId)` | `GET` | `/orders/:orderId` | Returns a single order with line items |
| `cancelOrder(orderId)` | `POST` | `/orders/:orderId/cancel` | Cancels an order |

### Payments (`src/api/payments.ts`)

| Function | Method | Path | Description |
|---|---|---|---|
| `createPaymentForOrder(orderId, method)` | `POST` | `/payments/orders/:orderId` | Creates a payment record (COD or Razorpay) |
| `getPaymentForOrder(orderId)` | `GET` | `/payments/orders/:orderId` | Returns the payment for an order |

### Wishlist (`src/api/wishlist.ts`)

| Function | Method | Path | Description |
|---|---|---|---|
| `getOrCreateDefaultWishlist()` | `GET/POST` | `/wishlists` | Returns or creates the default wishlist |
| `addWishlistItem(wishlistId, productId)` | `POST` | `/wishlists/:id/items` | Adds a product to a wishlist |
| `removeWishlistItem(wishlistId, itemId)` | `DELETE` | `/wishlists/:id/items/:itemId` | Removes an item from a wishlist |

### Addresses (`src/api/addresses.ts`)

| Function | Method | Path | Description |
|---|---|---|---|
| `listAddresses()` | `GET` | `/addresses` | Returns all saved addresses |
| `createAddress(data)` | `POST` | `/addresses` | Creates a new address |
| `deleteAddress(addressId)` | `DELETE` | `/addresses/:addressId` | Deletes an address |

---

## 5. Response Mappers (`src/api/mappers.ts`)

Converts raw backend API response shapes into the client-side `DemoOrder` and `Session` domain types.

| Mapper | Input | Output |
|---|---|---|
| `mapOrder(raw)` | Backend order response | `DemoOrder` |
| `mapSession(raw)` | Backend session response | `Session` |

---

## 6. Real-time (`src/api/realtime.ts`)

Establishes a **Socket.io** connection to the backend WebSocket gateway to receive live catalog update events.

### `subscribeToCatalogUpdates(onUpdate): () => void`

Connects to `socket.io` at the configured backend URL and listens for catalog change events. Returns an unsubscribe function.

```
Connect to backend Socket.io
 → on 'catalog:update' → call onUpdate()

Unsubscribe → socket.disconnect()
```

---

*End of API Layer*

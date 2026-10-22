# Vendor — API Layer & Integration

> [← Back to Vendor Index](./README.md)

---

## Purpose

The `vendor/src/features/vendor/api/` directory encapsulates all network communication, backend discovery, Supabase authentication, and unified data adapters.

The architecture provides a **dual-path adapter pattern**:
- In **Live Mode**, operations dispatch REST calls to the aasPass NestJS server.
- In **Demo Mode**, operations interact with an in-memory clone of seed data with simulated network latency (150ms).

---

## 1. HTTP Client (`client.ts`)

The client is a zero-dependency wrapper around standard `fetch`:

```typescript
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new ApiError(0, "Backend URL not configured");

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.message;
    throw new ApiError(
      response.status,
      Array.isArray(message) ? message.join(", ") : (message ?? response.statusText),
    );
  }
  return body as T;
}
```

### Key Behaviors
- **Stateless Bearer Forwarding**: The NestJS server delegates identity to Supabase. When a user authenticates, their Supabase JWT is attached as `Authorization: Bearer <token>`.
- **204 No Content Handling**: Automatically converts HTTP 204 into `undefined`.
- **Validation Message Unpacking**: Formats NestJS `class-validator` error arrays into readable comma-delimited strings.

---

## 2. Connection Discovery & Configuration (`config.ts`)

The app dynamically resolves the API and Supabase endpoints by checking:
1. Persisted device settings stored in `aaspass.vendor.connection.v1`.
2. Environment variables (`EXPO_PUBLIC_AASPASS_API_URL`, `EXPO_PUBLIC_AASPASS_SUPABASE_URL`, `EXPO_PUBLIC_AASPASS_SUPABASE_ANON_KEY`, or `VITE_*` equivalents).
3. Fallback defaults (`http://localhost:3000`).

This enables merchants running physical mobile devices or Android emulators to easily point the app to a machine's LAN IP address via the **Connect to server** screen without recompiling.

---

## 3. Supabase Authentication (`auth.ts`)

Live sessions authenticate via Supabase Auth:

```typescript
export async function signInVendor(email: string, password: string): Promise<string> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message ?? "Sign in failed");
  return data.session.access_token;
}
```

---

## 4. API Endpoints Reference (`vendor.ts`)

### Store Endpoints

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getMyStore()` | `GET` | `/stores/me` | Fetch store profile for authenticated vendor |
| `createStore(input)` | `POST` | `/stores` | Onboard and register a new store |
| `updateStore(input)` | `PATCH` | `/stores/me` | Update address, contact, or business numbers |
| `getHours()` | `GET` | `/stores/me/hours` | Retrieve 7-day operating schedule |
| `saveHours(hours)` | `PUT` | `/stores/me/hours` | Batch replace opening/closing hours |
| `getDelivery()` | `GET` | `/stores/me/delivery-settings` | Get delivery radius, charges, and minimums |
| `updateDelivery(input)` | `PATCH` | `/stores/me/delivery-settings` | Update delivery fees and thresholds |

---

### Catalog & Master Data Endpoints

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getMasterProducts()` | `GET` | `/catalog/master-products` | List global master catalog items |
| `getCategories()` | `GET` | `/catalog/categories` | List global categories |
| `getUnits()` | `GET` | `/catalog/units` | List global measurement units |
| `getStoreProducts()` | `GET` | `/catalog/store-products/me` | List products assigned to current store |
| `createStoreProduct(input)` | `POST` | `/catalog/store-products/me` | Add master item to store with custom pricing |
| `updateStoreProduct(id, input)` | `PATCH` | `/catalog/store-products/me/:id` | Update MRP, selling price, or status |
| `deleteStoreProduct(id)` | `DELETE` | `/catalog/store-products/me/:id` | Remove product and inventory link |

---

### Inventory Management Endpoints

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getInventory()` | `GET` | `/inventory/me` | List stock records for all store products |
| `createInventory(input)` | `POST` | `/inventory/me` | Initialize stock tracking for a store product |
| `updateInventory(id, input)` | `PATCH` | `/inventory/me/:id` | Update low stock threshold or reorder level |
| `adjustInventory(id, input)` | `POST` | `/inventory/me/:id/adjust` | Log stock change with OCC version check |
| `getTransactions(id)` | `GET` | `/inventory/me/:id/transactions` | Fetch audit ledger for an inventory item |

---

### Order Management (Preview / Demo Flow)

The backend does not yet expose merchant-facing order queue endpoints (order checkout is customer-facing). Consequently, `vendor/src/features/vendor/api/vendor.ts` flags:
```typescript
export const ORDERS_ARE_PREVIEW = true;
```
All order operations (`getOrders`, `getOrder`, `setOrderStatus`, `markCodPaid`) run through an in-memory queue, enabling complete demonstration of order packing, dispatching, and COD collection.

---

## 5. Real-Time Catalog Updates

When live vendor operations modify store details, hours, delivery settings, product prices, or stock levels, the backend emits an event over the `/catalog` Socket.IO namespace:

```
Event: catalog.updated (payload-free)
```

Connected customer mobile apps receive this broadcast and automatically invalidate their local query caches, providing seamless real-time stock and price synchronization.

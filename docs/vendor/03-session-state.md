# Vendor — Session & State Management

> [← Back to Vendor Index](./README.md)

---

## Purpose

This document details client-side session management, state persistence, live vs. demo mode switching, and query caching across the vendor application.

---

## 1. Session Store (`vendor/src/features/vendor/session.ts`)

The vendor app uses **Zustand** with `persist` middleware to manage authentication and runtime mode.

### State Interface

```typescript
export type VendorSession = {
  mode: "demo" | "live";
  email: string;
  name: string;
};

type SessionState = {
  session: VendorSession | null;
  token: string | null;
  hydrated: boolean;
  signIn: (session: VendorSession, token?: string | null) => void;
  signOut: () => void;
};
```

---

## 2. Multi-Platform Storage Strategy

Because the vendor codebase executes in both React Native (iOS/Android) and browser environments, a platform-aware storage abstraction is implemented:

```typescript
const secureStorage = {
  getItem: (key: string) =>
    Platform.OS === "web" ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    Platform.OS === "web" ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  removeItem: (key: string) =>
    Platform.OS === "web" ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};
```

- **Native (iOS/Android)**: Hardware-backed keychain/keystore via `expo-secure-store` encrypts authentication tokens.
- **Web**: `@react-native-async-storage/async-storage` saves the session across page reloads.
- **Hydration Hook**: `skipHydration: true` prevents initial SSR/native flicker. The app explicitly calls `useSession.persist.rehydrate()` inside `_layout.tsx` / `__root.tsx` on mount.

---

## 3. Demo Mode vs. Live Mode

The app supports two execution modes determined by `session.mode`:

| Mode | Trigger | Token | Data Persistence | Real-time Socket |
|---|---|---|---|---|
| **Demo Mode** (`mode: "demo"`) | "Try Sample Store" button | `null` | In-memory demo DB (`demo-data.ts`) | Simulated / Offline |
| **Live Mode** (`mode: "live"`) | Supabase credentials | Bearer JWT | NestJS Backend + PostgreSQL | Socket.io `/catalog` events |

### Mode Helper

The global helper `isLive()` inspects current Zustand state:
```typescript
export const isLive = () => useSession.getState().session?.mode === "live";
```
Every API adapter function in `vendor/src/features/vendor/api/vendor.ts` branches on `isLive()` to either send an HTTP request via `apiFetch()` or update the local in-memory store with simulated network latency.

---

## 4. Token Forwarding Pipeline

When a vendor logs in to Live Mode:
1. `signIn(session, token)` is invoked.
2. `setApiAccessToken(token)` is called immediately, updating the module-level token in `client.ts`.
3. Every subsequent call made via `apiFetch` includes `Authorization: Bearer <token>`.
4. When `signOut()` is called, `setApiAccessToken(null)` clears the header, and user state resets to unauthenticated.

---

## 5. Server State & TanStack Query Caching (`vendor/src/features/vendor/queries.ts`)

All remote and mock data access is wrapped in TanStack Query options:

### Query Keys

| Query Key | Function | Stale Time |
|---|---|---|
| `["vendor", "store"]` | `api.getMyStore` | Default (0) |
| `["vendor", "hours"]` | `api.getHours` | Default (0) |
| `["vendor", "delivery"]` | `api.getDelivery` | Default (0) |
| `["vendor", "master-products"]` | `api.getMasterProducts` | 5 minutes |
| `["vendor", "categories"]` | `api.getCategories` | 5 minutes |
| `["vendor", "units"]` | `api.getUnits` | 5 minutes |
| `["vendor", "products"]` | `api.getStoreProducts` | Default (0) |
| `["vendor", "inventory"]` | `api.getInventory` | Default (0) |
| `["vendor", "transactions", id]` | `api.getTransactions(id)` | Default (0) |
| `["vendor", "orders"]` | `api.getOrders` | Default (0) |
| `["vendor", "order", id]` | `api.getOrder(id)` | Default (0) |

### Mutation Wrapper (`useVendorMutation`)

A standardized mutation hook wraps mutations with automatic cache invalidation and toast notifications:

```typescript
export function useVendorMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  success?: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["vendor"] });
      if (success) toast.success(success);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
```
Any modification (updating store hours, adding a product, or adjusting stock) automatically purges stale queries across all open screens and components.

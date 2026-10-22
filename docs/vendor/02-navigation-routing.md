# Vendor — Navigation & Routing

> [← Back to Vendor Index](./README.md)

---

## Purpose

The aasPass Vendor application provides complete administrative functionality across both native devices (via **Expo Router**) and desktop browsers (via **TanStack Router / Start**). This document outlines both route trees, file-system mapping conventions, URL parameters, and authentication gatekeeping.

---

## Architecture Comparison

| Feature | Expo Router (`vendor/app/`) | TanStack Router (`vendor/src/routes/`) |
|---|---|---|
| **Primary Platform** | Android, iOS, Expo Web | Modern Desktop / Full-width Web |
| **Routing Pattern** | File-system based | File-system based (auto-generated tree) |
| **Dynamic Segments** | `[param].tsx` syntax | `$param.tsx` syntax |
| **Layouts** | `_layout.tsx` (Stack / Tabs) | `__root.tsx` (Outlet based) |
| **Type Safety** | Path autocompletion via Expo CLI | Fully typed routes via `routeTree.gen.ts` |
| **Link Component** | `<Link href="...">` / `router.push()` | `<Link to="...">` / `navigate()` |

---

## 1. Expo Router Route Tree (`vendor/app/`)

### File-to-Route Mapping

```
vendor/app/
├── _layout.tsx                     → Root Stack navigator & Auth Guard
├── index.tsx                       → / (Vendor Sign In & Mode Selector)
├── connect.tsx                     → /connect (Backend & Supabase Configuration)
├── (tabs)/
│   ├── _layout.tsx                 → Bottom Tab Navigator
│   ├── orders.tsx                  → /(tabs)/orders (Active Orders Queue)
│   ├── products.tsx                → /(tabs)/products (Store Catalog & Stock)
│   └── store.tsx                   → /(tabs)/store (Store Profile & Links)
├── orders/
│   └── [orderId].tsx               → /orders/:orderId (Order Detail & Actions)
├── products/
│   ├── new.tsx                     → /products/new (Onboard Master Catalog Item)
│   └── [productId].tsx             → /products/:productId (Edit Price & Adjust Stock)
└── store/
    ├── hours.tsx                   → /store/hours (Weekly Operating Schedule)
    └── delivery.tsx                → /store/delivery (Delivery Radii & Fees)
```

### Tab Configuration (`vendor/app/(tabs)/_layout.tsx`)

The bottom tab navigator defines 3 primary tabs:
1. **Orders** (`orders.tsx`): Icon `Inbox`, badge showing active orders count.
2. **Products** (`products.tsx`): Icon `Package2`, displays total store items.
3. **Store** (`store.tsx`): Icon `Store`, displays store open/closed status.

```tsx
<Tabs screenOptions={{
  tabBarActiveTintColor: palette.primary,
  tabBarInactiveTintColor: palette.muted,
  tabBarStyle: { borderTopColor: palette.border },
  headerShown: false,
}}>
  <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ... }} />
  <Tabs.Screen name="products" options={{ title: "Products", tabBarIcon: ... }} />
  <Tabs.Screen name="store" options={{ title: "Store", tabBarIcon: ... }} />
</Tabs>
```

---

## 2. TanStack Router Route Tree (`vendor/src/routes/`)

TanStack Start generates `vendor/src/routeTree.gen.ts` from files in `vendor/src/routes/`:

### File-to-Route Mapping

| Route File | URL Path | Description |
|---|---|---|
| `__root.tsx` | `/` (Shell) | Main header navigation, store badge, Toaster |
| `index.tsx` | `/` | Vendor login, demo mode trigger |
| `connect.tsx` | `/connect` | API and Supabase endpoint setup |
| `orders.index.tsx` | `/orders` | Order management dashboard |
| `orders.$orderId.tsx` | `/orders/:orderId` | Order details, customer address, invoice |
| `products.index.tsx` | `/products` | Catalog table, stock levels, quick filters |
| `products.new.tsx` | `/products/new` | Master product selection & pricing form |
| `products.$productId.tsx` | `/products/:productId` | Edit selling price, OCC stock adjustments |
| `store.index.tsx` | `/store` | Store profile form, business registration, GST |
| `store.hours.tsx` | `/store/hours` | Weekly hours table with quick toggle |
| `store.delivery.tsx` | `/store/delivery` | Delivery radius, charges, minimum order |

---

## Route Protection & Redirect Flows

### Unauthenticated State
- Accessing any dashboard route (`/orders`, `/products`, `/store`) redirects to `/`.
- The sign-in page allows merchants to:
  1. **Enter Sample Store (Demo Mode)**: Creates an instant offline session with seeded in-memory store, inventory, and order data.
  2. **Sign In With Supabase (Live Mode)**: Authenticates against the backend Supabase instance and retrieves a valid JWT access token.

### Authenticated State
- Attempting to visit `/` when already logged in automatically redirects to `/orders` (or `/(tabs)/orders` on mobile).
- The `/connect` route is always accessible from both sign-in and account menus to allow updating backend hostnames or ports (e.g., when testing across LAN IP addresses).

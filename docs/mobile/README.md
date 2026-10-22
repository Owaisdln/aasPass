# Mobile App Documentation

> [← Back to Index](../README.md)

---

## Purpose

This section documents the **aasPass Mobile App** — a React Native (Expo) customer-facing application for the aasPass hyperlocal commerce platform. It allows users to browse nearby stores, discover products, manage a multi-store cart, place orders, track deliveries, and manage their account.

---

## Document Index

| Document | Description |
|---|---|
| [App Bootstrap & Layout](./01-bootstrap-layout.md) | Root layout, splash screen, providers, navigation setup |
| [Navigation & Routing](./02-navigation-routing.md) | Expo Router file-system routing, tab layout, screen hierarchy |
| [State Management](./03-state-management.md) | Zustand store (`useAppStore`), sync architecture, state slices |
| [Domain Models](./04-domain-models.md) | Core TypeScript types, pure helpers (`model.ts`) |
| [API Layer](./05-api-layer.md) | HTTP client, Supabase auth, API modules by domain |
| [Components](./06-components.md) | Reusable UI components |
| [Screens](./07-screens.md) | Screen-by-screen feature reference |

---

## Architecture Overview

```
mobile/
├── app/                     ← Expo Router file-system routes
│   ├── _layout.tsx          ← Root layout (providers, navigation, splash)
│   ├── (tabs)/              ← Bottom-tab navigator
│   │   ├── _layout.tsx      ← Tab bar configuration
│   │   ├── index.tsx        ← Home tab
│   │   ├── search.tsx       ← Search tab
│   │   ├── orders.tsx       ← Orders tab
│   │   ├── wishlist.tsx     ← Wishlist tab
│   │   └── account.tsx      ← Account tab
│   ├── store/[storeId].tsx  ← Store detail screen
│   ├── product/[productId].tsx ← Product detail screen
│   ├── order/[orderId].tsx  ← Order detail screen
│   ├── cart.tsx             ← Cart screen
│   ├── checkout.tsx         ← Checkout screen
│   ├── sign-in.tsx          ← Authentication screen
│   ├── sessions.tsx         ← Active sessions screen
│   └── connection.tsx       ← Backend connection configuration screen
└── src/
    ├── api/                 ← HTTP API modules + Supabase auth
    │   ├── client.ts        ← Thin fetch wrapper (apiFetch, ApiError)
    │   ├── config.ts        ← Connection configuration (URL, Supabase keys)
    │   ├── auth.ts          ← Supabase auth (sign in, OTP, sign out)
    │   ├── users.ts         ← User profile + sessions API
    │   ├── stores.ts        ← Stores API
    │   ├── catalog.ts       ← Products API
    │   ├── carts.ts         ← Cart API
    │   ├── orders.ts        ← Orders API
    │   ├── payments.ts      ← Payments API
    │   ├── wishlist.ts      ← Wishlist API
    │   ├── addresses.ts     ← Addresses API
    │   ├── realtime.ts      ← Socket.io real-time catalog updates
    │   └── mappers.ts       ← Response-to-domain-model mappers
    ├── components/          ← Shared UI components
    ├── screens/             ← Screen component implementations
    ├── model.ts             ← Domain types and pure helpers
    ├── store.ts             ← Zustand app state
    ├── queries.ts           ← TanStack Query hooks
    ├── theme.ts             ← Color tokens and design system
    ├── data.ts              ← Local demo data + asset references
    ├── totals.ts            ← Cart/order total calculation helpers
    └── utils/               ← Utility functions (invoice generation)
```

---

## Technology Stack

| Category | Technology | Version |
|---|---|---|
| **Runtime** | React Native | 0.86.3 |
| **Framework** | Expo | ~57.0.24 |
| **Language** | TypeScript | ~6.0.3 |
| **Routing** | Expo Router | ~57.0.22 |
| **State** | Zustand | ^5.0.15 |
| **Server State** | TanStack React Query | ^5.103.2 |
| **Auth** | Supabase JS | ^2.117.1 |
| **Real-time** | Socket.io Client | ^4.8.3 |
| **Fonts** | Expo Google Fonts (Nunito Sans) | ^0.4.2 |
| **Icons** | Lucide React Native | ^1.47.0 |
| **Storage** | AsyncStorage | 2.2.0 |
| **Secure Storage** | Expo Secure Store | ~57.0.4 |
| **PDF** | jsPDF + expo-print + expo-sharing | ^4.2.1 |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start Metro bundler / Expo dev server |
| `npm run android` | Launch on Android emulator or device |
| `npm run ios` | Launch on iOS simulator or device |
| `npm run web` | Launch in the browser |
| `npm run lint` | Run ESLint via `expo lint` |

---

*End of Mobile App Documentation Index*

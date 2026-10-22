# Vendor App Documentation

> [← Back to Index](../README.md)

---

## Purpose

This section documents the **aasPass Vendor App** (`vendor/`) — a cross-platform management application designed for store owners and vendors on the aasPass hyperlocal commerce platform.

The vendor app allows store merchants to:
- Configure store profile details (name, contact, location coordinates, business registration, GST).
- Set weekly operational hours (per-day opening/closing times and closed flags).
- Configure delivery parameters (minimum order amount, delivery radius in km, delivery fees, free delivery threshold, estimated delivery times).
- Browse master catalog items and onboard products into their personal store catalog with custom MRP, selling price, and featured flags.
- Manage stock inventory with optimistic concurrency control (OCC version checking) and log inventory transactions (`PURCHASE`, `RESTOCK`, `RETURN`, `SALE`, `DAMAGE`, `EXPIRED`).
- View incoming customer orders, manage real-time order lifecycle transitions (`PENDING` → `CONFIRMED` → `PREPARING` → `READY_FOR_PICKUP` / `OUT_FOR_DELIVERY` → `DELIVERED`), and track COD payments.
- Toggle seamlessly between an offline demo preview (in-memory mock store) and live production mode backed by Supabase Auth and the aasPass NestJS API.

---

## Document Index

| Document | Description |
|---|---|
| [App Bootstrap & Layout](./01-bootstrap-layout.md) | Entry points, layout shells, TanStack Query setup, theme tokens & design system |
| [Navigation & Routing](./02-navigation-routing.md) | Dual routing engines: Expo Router (mobile/universal) & TanStack Start (web) |
| [Session & State Management](./03-session-state.md) | Zustand `useSession`, SecureStore/AsyncStorage persistence, demo vs live mode |
| [Domain Models & Business Rules](./04-domain-models-rules.md) | Core TypeScript types, OCC versioning, price validation, stock delta rules, order status machine |
| [API Layer & Integration](./05-api-layer.md) | HTTP client, Supabase authentication, connection settings, REST endpoints, real-time catalog sync |
| [Screens & Feature Reference](./06-screens-features.md) | In-depth walkthrough of all screens: Connect, Auth, Store, Hours, Delivery, Products, Inventory, Orders |

---

## Architecture Overview

The vendor application is engineered with a **dual-target UI architecture**:
1. **Universal Native/Expo Target (`vendor/app/`)**: Powered by Expo Router and React Native, targeting Android, iOS, and mobile web with native components (`ScrollView`, `Pressable`, `TextInput`).
2. **Modern Web Target (`vendor/src/routes/`)**: Powered by TanStack Start / Router and Vite/Tailwind, targeting full desktop web vendor dashboards with Radix UI / shadcn primitives.
3. **Shared Business Core (`vendor/src/features/vendor/`)**: Both UI targets share 100% of the domain models, validation rules, demo mock datasets, Zustand session state, TanStack Query hooks, and API adapters.

```
vendor/
├── app/                              ← Expo Router universal file-system routes
│   ├── _layout.tsx                   ← Root layout (providers, session hydration)
│   ├── index.tsx                     ← Sign-in & mode selector (demo vs live)
│   ├── connect.tsx                   ← Backend & Supabase connection settings
│   ├── (tabs)/                       ← Bottom-tab navigator
│   │   ├── _layout.tsx               ← Tab navigation shell
│   │   ├── orders.tsx                ← Order queue list tab
│   │   ├── products.tsx              ← Product catalog & inventory list tab
│   │   └── store.tsx                 ← Store profile & settings tab
│   ├── orders/
│   │   └── [orderId].tsx             ← Order detail & status progression
│   ├── products/
│   │   ├── new.tsx                   ← Add store product from master catalog
│   │   └── [productId].tsx           ← Edit product & OCC inventory adjustment
│   └── store/
│       ├── hours.tsx                 ← Weekly operating hours editor
│       └── delivery.tsx              ← Delivery radius & fee configuration
├── src/
│   ├── features/vendor/              ← Shared vendor business logic & data layer
│   │   ├── model.ts                  ← Domain types mirroring NestJS DTOs
│   │   ├── rules.ts                  ← Pure business rules (pricing, stock deltas, order states)
│   │   ├── session.ts                ← Zustand session store (mode, token, persistence)
│   │   ├── queries.ts                ← TanStack Query options & mutation wrappers
│   │   ├── demo-data.ts              ← Realistic offline mock dataset
│   │   ├── components.tsx            ← Shared vendor UI components
│   │   ├── product-form.tsx          ← Reusable product editor form
│   │   └── api/
│   │       ├── client.ts             ← Fetch HTTP client with Bearer auth
│   │       ├── config.ts             ← API & Supabase connection URL resolution
│   │       ├── auth.ts               ← Supabase Auth sign-in / sign-out
│   │       └── vendor.ts             ← Unified API adapters (switches live API vs demo DB)
│   ├── native/
│   │   └── ui.tsx                    ← Cross-platform UI primitives for Expo Router
│   ├── routes/                       ← TanStack Start web file-system routes
│   │   ├── __root.tsx                ← Web shell (query client, header tabs)
│   │   ├── index.tsx                 ← Web sign-in
│   │   ├── connect.tsx               ← Web connection config
│   │   ├── orders.index.tsx          ← Web orders dashboard
│   │   ├── orders.$orderId.tsx       ← Web order details
│   │   ├── products.index.tsx        ← Web product catalog
│   │   ├── products.new.tsx          ← Web product creation
│   │   ├── products.$productId.tsx   ← Web product edit & stock
│   │   ├── store.index.tsx           ← Web store profile
│   │   ├── store.hours.tsx           ← Web hours editor
│   │   └── store.delivery.tsx        ← Web delivery settings
│   ├── components/ui/                ← Radix UI web primitives (dialog, button, table, etc.)
│   └── styles.css                    ← Tailwind CSS v4 design tokens
└── package.json
```

---

## Technology Stack

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Mobile Runtime** | React Native | 0.86.3 | Cross-platform mobile app |
| **Mobile Framework** | Expo | ~57.0.24 | Universal runtime, tooling & CLI |
| **Mobile Routing** | Expo Router | ~57.0.22 | File-system routing for native & Expo web |
| **Web Framework** | TanStack Start | 1.168.60 | Full-stack SSR/SPA framework for web |
| **Web Routing** | TanStack Router | 1.170.41 | Type-safe client-side routing for web |
| **Bundler / Build** | Vite | ^6.3.5 | Fast web development & production build |
| **Web Styling** | Tailwind CSS v4 | ^4.2.1 | Modern utility-first CSS |
| **Web UI Primitives** | Radix UI | Various | Accessible headless UI components |
| **Language** | TypeScript | ~5.8.2 | Strict type safety across mobile & web |
| **Client State** | Zustand | ^5.0.3 | Persistent session management |
| **Server State** | TanStack React Query | ^5.101.1 | Async caching, revalidation, and mutations |
| **Auth** | Supabase JS | ^2.118.0 | Email/password authentication |
| **Icons** | Lucide React / Lucide React Native | ^1.16.0 / ^1.47.0 | Consistent iconography |
| **Storage** | Expo SecureStore & AsyncStorage | ~57.0.4 / 2.2.0 | Multi-platform secure storage |
| **Testing** | Vitest | ^3.2.4 | Unit and business rule tests |

---

## Available Scripts

From the `vendor/` directory:

| Command | Description |
|---|---|
| `npm start` | Starts the Expo development server / Metro bundler |
| `npm run android` | Launches the app in an Android emulator or connected device |
| `npm run ios` | Launches the app in an iOS simulator (macOS required) |
| `npm run web` | Launches the Expo web development preview |
| `npm run typecheck` | Runs the TypeScript compiler (`tsc --noEmit`) to verify types |
| `npm run lint` | Runs Expo linter checks |
| `npm run test` | Executes unit tests with Vitest |
| `npm run format` | Formats all code with Prettier |

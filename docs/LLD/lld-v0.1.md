# Low Level Design (LLD) — aasPass Platform

> **Document Type:** Low Level Design  
> **Version:** v0.1 (Draft)  
> **Status:** 🟡 Draft  
> **Date:** 2026-07-28  
> **Author:** Engineering Team  

---

## Version History

| Version | Date | Status | Summary |
|---|---|---|---|
| v0.1 | 2026-07-28 | Draft | Initial LLD — Modules 1–6 schema & infrastructure layer |

---

## 1. Scope & Purpose

This document describes the **low-level technical implementation** of the aasPass backend platform as built so far. It covers the actual code artifacts, design decisions, data flow, and infrastructure configuration that have been implemented — not aspirational plans.

The LLD is organized by the same 6-module decomposition used in the codebase:

| # | Module | Domain |
|---|---|---|
| 1 | Identity & Access Management (IAM) | Auth, RBAC, Sessions, OTP |
| 2 | Store Management | Store, Hours, Delivery Settings |
| 3 | Catalog & Inventory | Products, Categories, Inventory |
| 4 | Cart & Wishlist | Cart, Cart Items, Wishlists |
| 5 | Order Management | Orders, Items, Replacements, History |
| 6 | Payment & Financial | Payments, Transactions, Refunds, Documents |

---

## 2. Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | ≥20 | — |
| Language | TypeScript | ^5.7 | Strict mode |
| Framework | NestJS | ^11.0 | Modular, DI-based |
| ORM | Prisma | ^7.8 | Driver-adapter mode (no `url` in datasource) |
| DB Driver | `pg` + `@prisma/adapter-pg` | ^8.22 / ^7.9 | Pool-based connection |
| Auth Provider | Supabase | ^2.110 | Manages auth users; app DB stays separate |
| Database | PostgreSQL | — | Primary data store |
| Cache / Queue | Redis + BullMQ | — | Job queues; guest-cart cache (planned) |
| Real-time | Socket.io | ^4.8 | WebSocket events |
| API Docs | Swagger (`@nestjs/swagger`) | ^11.4 | Auto-generated |
| Security | Helmet, `@nestjs/throttler` | — | Security headers + rate limiting |
| Validation | `class-validator`, `class-transformer`, `zod` | — | Zod for env; class-validator for DTOs |
| Logger | `nestjs-pino` / `pino` | — | Structured JSON logging |
| Auth Strategy | `passport-jwt` | — | JWT Bearer strategy |
| Password | `bcrypt` | ^6.0 | Hash-only storage |

---

## 3. Project Structure

```
server/
├── src/
│   ├── main.ts                     # Bootstrap: NestFactory.create, port binding
│   ├── app.module.ts               # Root module: ConfigModule, PrismaModule, SupabaseModule, AuthModule
│   ├── app.controller.ts           # Root controller: GET / health check
│   ├── config/
│   │   ├── app.config.ts           # app.port, app.nodeEnv
│   │   ├── database.config.ts      # database.url namespace
│   │   ├── supabase.config.ts      # supabase.url, anonKey, serviceRoleKey
│   │   ├── env.validation.ts       # Zod schema for all required env vars
│   │   └── index.ts                # Aggregates all config factories
│   ├── infrastructure/
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts   # PrismaClient extension with pg Pool adapter
│   │   │   └── prisma.module.ts    # Global PrismaModule
│   │   └── supabase/
│   │       ├── supabase.service.ts # anonClient + adminClient + verifyAccessToken + getUserById
│   │       ├── supabase.service.spec.ts # Unit tests for SupabaseService
│   │       └── supabase.module.ts  # Global SupabaseModule
│   ├── common/
│   │   └── identity/
│   │       └── current-user.model.ts # CurrentUser domain identity model (RBAC, status)
│   ├── shared/                     # (reserved) Shared DTOs, utilities
│   └── modules/
│       └── auth/                   # Authentication feature module
│           ├── auth.module.ts      # AuthModule registration
│           ├── controllers/
│           │   └── auth.controller.ts # AuthController: GET /auth/me
│           ├── decorators/
│           │   └── authenticated-user.decorator.ts # @AuthenticatedUser() param decorator
│           ├── guards/
│           │   └── supabase-auth.guard.ts # SupabaseAuthGuard (Bearer token validation)
│           └── services/
│               └── auth.service.ts # AuthService: authenticate(), user sync & RBAC loading
├── prisma/
│   ├── schema.prisma               # Aggregated Prisma schema (main entry)
│   ├── prisma.config.ts            # Prisma CLI config (datasource URL)
│   └── modules/
│       ├── module1.auth.prisma     # IAM — Roles, Users, OTP, Sessions
│       ├── module2.store.prisma    # Store, Hours, Delivery Settings
│       ├── module3.catalog.prisma  # Categories, Brands, Products, Inventory
│       ├── module4.cart.prisma     # Carts, CartItems, Wishlists
│       ├── module5.order.prisma    # Orders, Items, Replacements, History
│       └── module6.payment.prisma  # Payments, Transactions, Refunds, Webhooks
```

---

## 4. Infrastructure Layer

### 4.1 Application Bootstrap (`main.ts`)

```typescript
const app = await NestFactory.create(AppModule);
const port = configService.get<number>('app.port', 3000);
await app.listen(port);
```

- Single-port HTTP server; WebSocket attachment planned on same port via Socket.io adapter.
- No global prefix or versioning prefix applied yet (reserved for feature module phase).

### 4.2 Root Module (`app.module.ts`)

```
AppModule
  └── ConfigModule  (isGlobal: true, cache: true, expandVariables: true)
  └── PrismaModule  (global provider)
  └── SupabaseModule
```

- `ConfigModule` loads `.env`, executes Zod validation, and caches results — safe to inject `ConfigService` anywhere.

### 4.3 Environment Validation (`env.validation.ts`)

Validated using **Zod** at startup. Server hard-fails if any required variable is missing or malformed.

| Variable | Type | Notes |
|---|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` | Default: `development` |
| `PORT` | `number` (positive int) | Default: `3000` |
| `DATABASE_URL` | URL string | PostgreSQL connection string |
| `SUPABASE_URL` | URL string | Supabase project URL |
| `SUPABASE_ANON_KEY` | string (min 1) | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | string (min 1) | Admin service role key |

### 4.4 Config Namespaces

Defined via `registerAs` factories and injected via `ConfigService.get('namespace.key')`:

| Namespace | Key | Env Var |
|---|---|---|
| `app` | `app.port` | `PORT` |
| `app` | `app.nodeEnv` | `NODE_ENV` |
| `database` | `database.url` | `DATABASE_URL` |
| `supabase` | `supabase.url` | `SUPABASE_URL` |
| `supabase` | `supabase.anonKey` | `SUPABASE_ANON_KEY` |
| `supabase` | `supabase.serviceRoleKey` | `SUPABASE_SERVICE_ROLE_KEY` |

### 4.5 Database Connection (`src/infrastructure/prisma/prisma.service.ts`)

Prisma v7 requires an explicit driver adapter — the datasource block in `schema.prisma` has **no `url` field**. The URL is provided at runtime only.

```
PrismaService constructor flow:
  1. Create pg.Pool from process.env.DATABASE_URL
  2. Wrap in PrismaPg adapter
  3. Pass { adapter } to super() — Prisma 7 constructor signature
  4. OnModuleInit  → $connect()
  5. OnModuleDestroy → $disconnect() + pool.end()   ← prevents connection leaks
```

### 4.6 Supabase Clients & Token Verification (`src/infrastructure/supabase/supabase.service.ts`)

Two separate `SupabaseClient` instances are created at module init:

| Client | Key Used | Purpose |
|---|---|---|
| `anonClient` | `SUPABASE_ANON_KEY` | Public-facing auth operations & JWT verification (`getUser`) |
| `adminClient` | `SUPABASE_SERVICE_ROLE_KEY` | Admin operations (bypasses RLS, manage users by ID) |

Both clients are created with `autoRefreshToken: false` and `persistSession: false` — the server manages tokens stateless, not the Supabase SDK.

#### Key Service Methods:
- `verifyAccessToken(accessToken: string): Promise<User>`: Calls `anonClient.auth.getUser(accessToken)`. Throws `UnauthorizedException` if invalid/expired.
- `getUserById(userId: string): Promise<User>`: Calls `adminClient.auth.admin.getUserById(userId)`. Throws `UnauthorizedException` if user not found.

---

## 5. Schema Architecture

### 5.1 Split-Schema Design

The Prisma schema is **split into 6 module files** under `prisma/modules/`, each containing the models and enums for one domain. The root `schema.prisma` aggregates them all and contains the datasource/generator config.

This keeps each file focused and manageable while allowing a single `prisma generate` / `prisma migrate` to process all models.

### 5.2 Global Schema Conventions

Applied uniformly across all 6 modules:

| Convention | Rule | Example |
|---|---|---|
| Primary Key | `@id @default(uuid()) @db.Uuid` | `id String @id @default(uuid()) @db.Uuid` |
| Table name | `snake_case` via `@@map` | `@@map("user_sessions")` |
| Column name | `snake_case` via `@map` | `@map("created_by")` |
| Enum type name | `snake_case` via `@@map` | `@@map("order_status")` |
| Audit fields | `createdBy`, `updatedBy`, `createdAt`, `updatedAt` | On every mutable model |
| Soft-delete | `deletedAt DateTime?` | On user-facing, recoverable data |
| Timestamps | `@db.Timestamptz(6)` | Time-zone-aware |
| Cascade rules | Cascade only on child/join tables; Restrict on business entities | Prevents accidental data loss |
| Optimistic Lock | `version Int @default(0)` | `Order`, `Inventory` models |

---

## 6. Module 1 — Identity & Access Management (IAM)

**File:** `prisma/modules/module1.auth.prisma`

### 6.1 Design Decisions

#### 6.1.1 Supabase as Auth Provider
The platform delegates authentication (signup, OTP, JWT issuance) to **Supabase Auth**. Supabase manages the `auth.users` table. The application's `users` table mirrors the Supabase user via the same UUID `id` — the PK is **not** auto-generated (`@id @db.Uuid`, no `@default(uuid())`), it is set from Supabase's user ID.

#### 6.1.2 RBAC via Roles & Permissions
- `Role` → `roles`: Platform-defined roles (`isSystem: true` for system roles that cannot be deleted).
- `Permission` → `permissions`: Granular permissions grouped by `module`.
- `RolePermission` → `role_permissions`: Many-to-many join with `@@unique([roleId, permissionId])`.

#### 6.1.3 Business OTP (not Auth OTP)
`BusinessOTP` (`business_otps`) is separate from Supabase's own OTP flow. It handles **business-context OTPs** such as:
- `ORDER_DELIVERY` — OTP to confirm delivery at doorstep.
- `ORDER_PICKUP` — OTP to confirm customer pickup.
- `ACCOUNT_RECOVERY` — Secondary recovery flow.
- `SENSITIVE_ACTION` — High-security actions (e.g., withdrawal, deletion).

The `referenceType`/`referenceId` polymorphic pair links OTPs to the entity they protect. These are **nullable** because `ACCOUNT_RECOVERY` has no business entity — only a user.

#### 6.1.4 Session Tracking
`UserSession` (`user_sessions`) records each device login with device fingerprinting (`deviceType`, `deviceId`, `deviceName`), IP, and user-agent. Revocation reason enum allows forensic auditing.

### 6.2 Models

| Model | Table | Purpose |
|---|---|---|
| `Role` | `roles` | Platform roles (RBAC) |
| `Permission` | `permissions` | Granular permission codes |
| `RolePermission` | `role_permissions` | Role ↔ Permission M:N join |
| `User` | `users` | Registered user — mirrors Supabase Auth UUID |
| `Address` | `addresses` | User delivery/billing addresses |
| `BusinessOTP` | `business_otps` | Business-context OTP (delivery, pickup, recovery) |
| `UserSession` | `user_sessions` | Per-device session records |

### 6.3 Key Relationships

```
Role ──< RolePermission >── Permission
Role ──< User
User ──< Address
User ──< BusinessOTP
User ──< UserSession
```

### 6.4 Enums

| Enum | DB Type | Values |
|---|---|---|
| `UserStatus` | `user_status` | `ACTIVE`, `INACTIVE`, `BLOCKED`, `PENDING_VERIFICATION` |
| `OTPPurpose` | `otp_purpose` | `ORDER_DELIVERY`, `ORDER_PICKUP`, `ACCOUNT_RECOVERY`, `SENSITIVE_ACTION` |
| `OTPChannel` | `otp_channel` | `SMS`, `EMAIL` |
| `BusinessOTPReferenceType` | `business_otp_reference_type` | `ORDER`, `ACCOUNT` |
| `DeviceType` | `device_type` | `MOBILE`, `TABLET`, `DESKTOP`, `WEB` |
| `RevocationReason` | `revocation_reason` | `LOGOUT`, `PASSWORD_CHANGED`, `TOKEN_ROTATED`, `ACCOUNT_LOCKED`, `SECURITY`, `EXPIRED` |

### 6.5 Runtime Application Components & Authentication Flow

#### 6.5.1 `CurrentUser` Domain Model (`src/common/identity/current-user.model.ts`)
Encapsulates authenticated user context attached to HTTP requests:
- **Properties:** `id`, `email`, `phone`, `roleId`, `roleCode`, `permissions` (array of permission code strings), `status` (`UserStatus`).
- **Methods:** `hasRole(role)`, `hasPermission(permission)`, `isActive()`, `isBlocked()`.

#### 6.5.2 `SupabaseAuthGuard` (`src/modules/auth/guards/supabase-auth.guard.ts`)
NestJS `CanActivate` guard protecting authenticated endpoints:
1. Extracts `Bearer <token>` from the HTTP `Authorization` header.
2. Validates header presence and format (throws `UnauthorizedException` if missing or malformed).
3. Invokes `AuthService.authenticate(accessToken)`.
4. Attaches resulting `CurrentUser` object to `request.user`.

#### 6.5.3 `AuthService` (`src/modules/auth/services/auth.service.ts`)
Core authentication service coordinating Supabase JWT validation and local PostgreSQL user record synchronization:
1. **Token Verification:** Calls `SupabaseService.verifyAccessToken(accessToken)`.
2. **User Lookup:** Queries local PostgreSQL via `PrismaService.user.findUnique()` with deep inclusion of `role` and `rolePermissions.permission`.
3. **Auto-Provisioning (`syncUser`):** If user exists in Supabase Auth but not in application DB, creates a new `User` record with default `CUSTOMER` role (`UserStatus.ACTIVE`).
4. **Account Status Check:** Throws `UnauthorizedException('Your account has been blocked.')` if `status === BLOCKED`.
5. **Context Building:** Flattens loaded permission entities into an array of string codes and constructs a `CurrentUser` domain model instance.

#### 6.5.4 Custom Decorator & Controllers
- **`@AuthenticatedUser()` Decorator (`src/modules/auth/decorators/authenticated-user.decorator.ts`):** Injects `request.user` into route handler parameters.
- **`AuthController` (`src/modules/auth/controllers/auth.controller.ts`):** Exposes `GET /auth/me` endpoint protected by `SupabaseAuthGuard` to return the current user profile.

---

## 7. Module 2 — Store Management

**File:** `prisma/modules/module2.store.prisma`

### 7.1 Design Decisions

#### 7.1.1 One Store Per User
`Store.ownerId` has a `@unique` constraint — enforces the business rule that one user may only own one store on the platform.

#### 7.1.2 Dual-Status Model
A store has two independent status axes:
- `StoreStatus` — Operational lifecycle (`PENDING`, `ACTIVE`, `TEMPORARILY_CLOSED`, `SUSPENDED`, `CLOSED`). Managed by admin/platform.
- `VerificationStatus` — Document verification state (`PENDING`, `VERIFIED`, `REJECTED`). Managed by admin review.

#### 7.1.3 Checkout Eligibility Rule
A customer can only checkout from a store if **all three** conditions are true:
```
CanCheckout = (Store.status == ACTIVE)
           AND (Store.isOpen == true)
           AND (CurrentTime is within today's StoreHour window)
```
`isOpen` is a real-time merchant toggle (e.g., disable during rush hours). `StoreStatus` is the platform lifecycle. `StoreHour` is the scheduled availability.

#### 7.1.4 Object Storage Keys
All image references use `objectKey` / `logoKey` / `bannerKey` (`VarChar(500)`) — these are storage object keys, not CDN URLs. URLs are assembled at read-time from the key + CDN base URL. This allows CDN migration without data changes.

#### 7.1.5 Delivery Settings as Atomic Companion
`StoreDeliverySetting` is a **one-to-one** companion to `Store` and **must be created atomically** in the same transaction as `Store`. It is never optional at the application level, even though the FK is technically nullable.

### 7.2 Models

| Model | Table | Purpose |
|---|---|---|
| `Store` | `stores` | Merchant store entity |
| `StoreImage` | `store_images` | Gallery images with display ordering |
| `StoreHour` | `store_hours` | Operating hours per weekday |
| `StoreDeliverySetting` | `store_delivery_settings` | Delivery/pickup configuration |

### 7.3 Key Relationships

```
User (owner) ──1── Store
User (verifier) ──N── Store
Store ──< StoreImage
Store ──< StoreHour (7 rows, one per weekday)
Store ──1── StoreDeliverySetting
```

### 7.4 Enums

| Enum | DB Type | Values |
|---|---|---|
| `StoreStatus` | `store_status` | `PENDING`, `ACTIVE`, `TEMPORARILY_CLOSED`, `SUSPENDED`, `CLOSED` |
| `VerificationStatus` | `verification_status` | `PENDING`, `VERIFIED`, `REJECTED` |
| `WeekDay` | `week_day` | `MONDAY` … `SUNDAY` |

---

## 8. Module 3 — Catalog & Inventory

**File:** `prisma/modules/module3.catalog.prisma`

### 8.1 Design Decisions

#### 8.1.1 Master Product / Store Product Separation
The catalog uses a **two-tier product model**:
- `MasterProduct` — The canonical platform-wide product definition (name, SKU, barcode, GST, unit). Created and managed by admins.
- `StoreProduct` — The per-store listing. References `MasterProduct` and adds store-specific pricing (`mrp`, `sellingPrice`) and availability. One store can list the same master product at its own price.

This enforces **data consistency** (product name, HSN code, GST rate are authoritative on `MasterProduct`) while allowing **price customization** per store.

#### 8.1.2 Self-Referencing Category Hierarchy
`Category` self-references via `CategoryHierarchy` (named relation) using `parentCategoryId`. On parent delete, child categories receive `SetNull` on `parentCategoryId` — they become root categories rather than being deleted.

#### 8.1.3 Optimistic Concurrency Control on Inventory
`Inventory.version` is incremented on every stock update. The service layer reads the current version, applies the update conditionally (`WHERE version = ?`), and detects concurrent modification if zero rows are affected. This prevents overselling during simultaneous checkouts.

`Inventory.reservedQuantity` tracks stock held for unconfirmed orders. Available stock = `stockQuantity - reservedQuantity`.

#### 8.1.4 Inventory as Immutable Ledger
`InventoryTransaction` is **append-only** (no `updatedAt`, no soft-delete). Each record contains `balanceAfterTransaction` — a snapshot of inventory at the time of the transaction — enabling historical reconstruction without summing all transactions.

#### 8.1.5 Full-Text Search Vector
`MasterProduct.searchVector` is a PostgreSQL `tsvector` (Prisma `Unsupported` type). It is populated by a database trigger or a migration-managed generated column, enabling native full-text search via `@@` GIN index (to be applied in a migration).

### 8.2 Models

| Model | Table | Purpose |
|---|---|---|
| `Category` | `categories` | Product categories (self-referencing hierarchy) |
| `Brand` | `brands` | Platform-wide brand registry |
| `Unit` | `units` | Units of measure (kg, L, piece) |
| `MasterProduct` | `master_products` | Canonical product definition |
| `ProductImage` | `product_images` | Product gallery images |
| `StoreProduct` | `store_products` | Per-store product listing with custom pricing |
| `Inventory` | `inventory` | Current stock levels with OCC version |
| `InventoryTransaction` | `inventory_transactions` | Immutable stock movement ledger |

### 8.3 Key Relationships

```
Category ──< MasterProduct
Brand ──< MasterProduct
Unit ──< MasterProduct
MasterProduct ──< ProductImage
MasterProduct ──< StoreProduct
Store ──< StoreProduct
StoreProduct ──1── Inventory
Inventory ──< InventoryTransaction
```

### 8.4 Enums

| Enum | DB Type | Values |
|---|---|---|
| `ProductStatus` | `product_status` | `ACTIVE`, `INACTIVE`, `DISCONTINUED` |
| `ProductImageType` | `product_image_type` | `PRIMARY`, `GALLERY` |
| `AvailabilityStatus` | `availability_status` | `AVAILABLE`, `OUT_OF_STOCK`, `HIDDEN`, `DISCONTINUED` |
| `InventoryTransactionType` | `inventory_transaction_type` | `PURCHASE`, `SALE`, `RETURN`, `RESTOCK`, `ADJUSTMENT`, `DAMAGE`, `EXPIRED` |
| `InventoryReferenceType` | `inventory_reference_type` | `ORDER`, `PURCHASE`, `RETURN`, `MANUAL` |

---

## 9. Module 4 — Cart & Wishlist

**File:** `prisma/modules/module4.cart.prisma`

### 9.1 Design Decisions

#### 9.1.1 One Cart Per User Per Store
`@@unique([userId, storeId])` on `Cart` enforces the rule that a user has at most **one active cart per store**. Multi-store shopping requires one cart per store.

#### 9.1.2 Price Snapshots on CartItem
When a product is added to a cart, current pricing is frozen as snapshots on `CartItem`:

| Snapshot Field | Source |
|---|---|
| `productNameSnapshot` | `MasterProduct.name` |
| `unitSnapshot` | `Unit.symbol` + `MasterProduct.unitValue` |
| `mrpSnapshot` | `StoreProduct.mrp` |
| `sellingPriceSnapshot` | `StoreProduct.sellingPrice` |
| `gstRateSnapshot` | `MasterProduct.gstRate` |

This means if the store later changes its price, the cart item continues to display the price at the time of add-to-cart, and recalculates at checkout using live price.

#### 9.1.3 Wishlist vs Cart Snapshots
`WishlistItem` has **no price snapshots** — wishlists show live prices at render time. `CartItem` has full snapshots — carts preserve the price context. This is by design.

#### 9.1.4 Cart Status Lifecycle
```
ACTIVE → CHECKED_OUT  (on successful order placement)
ACTIVE → ABANDONED    (background job after TTL)
ACTIVE → EXPIRED      (system cleanup)
```

### 9.2 Models

| Model | Table | Purpose |
|---|---|---|
| `Cart` | `carts` | Active shopping cart — one per user per store |
| `CartItem` | `cart_items` | Line items with price snapshots |
| `Wishlist` | `wishlists` | Named bookmark list |
| `WishlistItem` | `wishlist_items` | Bookmarked store products |

### 9.3 Key Relationships

```
User ──< Cart
Store ──< Cart
Cart ──< CartItem
StoreProduct ──< CartItem
User ──< Wishlist
Wishlist ──< WishlistItem
StoreProduct ──< WishlistItem
```

### 9.4 Enums

| Enum | DB Type | Values |
|---|---|---|
| `CartStatus` | `cart_status` | `ACTIVE`, `CHECKED_OUT`, `ABANDONED`, `EXPIRED` |

---

## 10. Module 5 — Order Management

**File:** `prisma/modules/module5.order.prisma`

### 10.1 Design Decisions

#### 10.1.1 Delivery Address Snapshot (13 Fields)
The full delivery address is frozen on `Order` at placement time across 13 fields (`deliveryReceiverName`, `deliveryPhone`, `deliveryHouseNo`, `deliveryStreet`, `deliveryArea`, `deliveryLandmark`, `deliveryCity`, `deliveryState`, `deliveryCountry`, `deliveryPincode`, `deliveryLatitude`, `deliveryLongitude`, `deliveryEmail`). The `addressId` FK is retained for reference but the address data is immutable on the order.

This ensures the delivery address is never affected if the user later updates or deletes their address.

#### 10.1.2 Per-Item Fulfillment
Each `OrderItem` has its own `FulfillmentStatus`, enabling **partial fulfillment** — some items can be delivered, replaced, or cancelled independently.

#### 10.1.3 Item Replacement Workflow
`OrderItemReplacement` supports the merchant-initiated substitution flow:
1. Merchant marks item unavailable and suggests a replacement (`replacementStoreProductId`).
2. Full pricing snapshot of the replacement is stored (`replacementMrpSnapshot`, `replacementSellingPriceSnapshot`, etc.).
3. Customer is notified and responds (`customerResponse`).
4. `ReplacementStatus` transitions: `PENDING → ACCEPTED | REJECTED | CANCELLED`.

#### 10.1.4 Immutable Status History
`OrderStatusHistory` is **append-only** (no `updatedAt`). Every status transition is recorded with `previousStatus → newStatus` and an optional `remarks`. This provides a full forensic audit trail.

#### 10.1.5 Optimistic Concurrency Control
`Order.version` prevents lost updates during concurrent status transitions (e.g., two admins simultaneously processing the same order).

#### 10.1.6 Restrict FKs on Business Entities
`Order` uses `onDelete: Restrict` for `User`, `Store`, and `Address` — an order cannot be deleted by cascading a parent delete. This protects order integrity and financial records.

### 10.2 Models

| Model | Table | Purpose |
|---|---|---|
| `Order` | `orders` | Core order with full address snapshot and pricing |
| `OrderItem` | `order_items` | Line items with product/price snapshots and per-item fulfillment |
| `OrderItemReplacement` | `order_item_replacements` | Merchant-proposed replacement for unavailable items |
| `OrderStatusHistory` | `order_status_history` | Append-only status transition audit trail |
| `OrderNote` | `order_notes` | Multi-party notes (customer, merchant, system, delivery) |

### 10.3 Key Relationships

```
User ──< Order
Store ──< Order
Address ──< Order
Order ──< OrderItem
StoreProduct ──< OrderItem
OrderItem ──< OrderItemReplacement
StoreProduct ──< OrderItemReplacement (replacement product)
Order ──< OrderStatusHistory
Order ──< OrderNote
Order ──1── Payment (via Module 6)
Order ──< FinancialDocument (via Module 6)
```

### 10.4 Enums

| Enum | DB Type | Values |
|---|---|---|
| `OrderStatus` | `order_status` | `PENDING`, `CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `FAILED` |
| `FulfillmentType` | `fulfillment_type` | `DELIVERY`, `PICKUP` |
| `FulfillmentStatus` | `fulfillment_status` | `PENDING`, `CONFIRMED`, `REPLACED`, `CANCELLED`, `DELIVERED` |
| `ReplacementStatus` | `replacement_status` | `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` |
| `OrderNoteType` | `order_note_type` | `CUSTOMER`, `MERCHANT`, `SYSTEM`, `DELIVERY_PARTNER` |

---

## 11. Module 6 — Payment & Financial Management

**File:** `prisma/modules/module6.payment.prisma`

### 11.1 Design Decisions

#### 11.1.1 Payment as One-to-One with Order
Each `Order` has exactly one `Payment` record. The `Payment` aggregates the financial state: `payableAmount`, `paidAmount`, `refundedAmount`. Individual gateway charge attempts are tracked separately in `PaymentTransaction`.

#### 11.1.2 Append-Only Payment Transactions
`PaymentTransaction` records each **gateway charge attempt** separately. A payment failure does not overwrite data — a new transaction is appended. This enables retry tracking and fraud detection. The `@@unique([gateway, gatewayPaymentId])` constraint prevents duplicate entries for the same gateway transaction.

#### 11.1.3 Idempotent Webhook Processing
`PaymentWebhook.gatewayEventId` has a `@@unique` constraint — duplicate webhook deliveries are safely ignored via upsert. `isProcessed` + `processedAt` + `processingError` enable a dead-letter retry pattern for failed webhook processing.

#### 11.1.4 Financial Documents
`FinancialDocument` tracks generated PDFs (invoices, receipts, credit notes) stored via object storage keys (`pdfKey`). `documentNumber` is globally unique for tax-compliant sequential numbering.

#### 11.1.5 Razorpay Integration Fields
`PaymentTransaction` stores Razorpay-specific fields:
- `gatewayOrderId` — Razorpay order ID (created before payment initiation).
- `gatewayPaymentId` — Razorpay payment ID (returned after payment).
- `gatewaySignature` — HMAC-SHA256 signature for server-side verification.
- `gatewayResponse` — Raw JSON response stored for audit/reconciliation.

### 11.2 Models

| Model | Table | Purpose |
|---|---|---|
| `Payment` | `payments` | Payment aggregate — one per order |
| `PaymentTransaction` | `payment_transactions` | Individual gateway charge attempts (append-only) |
| `Refund` | `refunds` | Partial/full refund tracking |
| `PaymentWebhook` | `payment_webhooks` | Idempotent gateway webhook event store |
| `FinancialDocument` | `financial_documents` | Invoice/receipt/credit note metadata |

### 11.3 Key Relationships

```
Order ──1── Payment
Payment ──< PaymentTransaction
Payment ──< Refund
Payment ──< PaymentWebhook
Order ──< FinancialDocument
```

### 11.4 Enums

| Enum | DB Type | Values |
|---|---|---|
| `PaymentMethod` | `payment_method` | `COD`, `UPI`, `CARD`, `NET_BANKING`, `WALLET` |
| `PaymentStatus` | `payment_status` | `PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `CANCELLED`, `PARTIALLY_REFUNDED`, `REFUNDED` |
| `PaymentGateway` | `payment_gateway` | `RAZORPAY`, `CASH` |
| `PaymentTransactionStatus` | `payment_transaction_status` | `INITIATED`, `SUCCESS`, `FAILED`, `CANCELLED` |
| `RefundStatus` | `refund_status` | `PENDING`, `PROCESSED`, `FAILED` |
| `FinancialDocumentType` | `financial_document_type` | `INVOICE`, `RECEIPT`, `CREDIT_NOTE` |

---

## 12. Cross-Module Data Flow

### 12.1 Order Placement Flow (Logical)

```
User has ACTIVE Cart
         │
         ▼
[Checkout Service]
  - Validate Store.status == ACTIVE && Store.isOpen == true
  - Validate StoreHour for today
  - Validate each CartItem still has sufficient inventory
    (StoreProduct.availabilityStatus == AVAILABLE)
    (Inventory.stockQuantity - Inventory.reservedQuantity >= qty)
         │
         ▼
[Order Creation — DB Transaction]
  - Create Order (snapshot delivery address from Address)
  - Create OrderItems (snapshot pricing from CartItem snapshots)
  - Increment Inventory.reservedQuantity per item
  - Increment Inventory.version (OCC)
  - Create Payment record (status: PENDING)
  - Update Cart.status = CHECKED_OUT
         │
         ▼
[Payment Gateway]
  - Create PaymentTransaction (status: INITIATED)
  - If success: PaymentTransaction.status = SUCCESS
                Payment.paidAmount updated
                Payment.paymentStatus = PAID
                Order.paymentStatus = PAID
  - If failure: PaymentTransaction.status = FAILED
                New retry transaction may be appended
```

### 12.2 Inventory Adjustment Flow

```
Order confirmed:
  Inventory.stockQuantity    -= ordered_qty
  Inventory.reservedQuantity -= ordered_qty
  Append InventoryTransaction (type: SALE, quantity: -N, balanceAfterTransaction: X)

Order cancelled:
  Inventory.reservedQuantity -= cancelled_qty
  Append InventoryTransaction (type: RETURN, quantity: +N)
```

---

## 13. Planned Work (Not Yet Implemented)

The following are planned but not yet in any schema or code:

| Area | Description |
|---|---|
| Feature modules (NestJS) | Auth, Store, Catalog, Cart, Order, Payment controllers/services |
| JWT Guard | `passport-jwt` strategy implementation |
| Role Guard | RBAC permission check guard |
| Coupon/Promotions | Coupon module — `couponId` removed from Cart pending this |
| Review Module | Store/product reviews — `averageRating` removed from Store pending this |
| Notification Module | Push notification system |
| BullMQ Queues | Email, notification, payment job queues |
| Socket.io Events | Real-time order status updates |
| Redis Cache | Guest cart sessions, token revocation cache |
| Global Filters | Exception filters for standardized error responses |
| Global Interceptors | Response transformation interceptor |
| Swagger Setup | API documentation configuration |

---

*End of LLD v0.1*

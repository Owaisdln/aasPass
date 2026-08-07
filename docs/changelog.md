# Changelog

> [← Back to Index](../README.md)

All notable changes to this project are documented here.

---

## [August 7, 2026]

### Server — Users Module (`UsersModule`) Implementation

- Created `UsersModule` (`src/modules/users/users.module.ts`) importing `PrismaModule` and `AuthModule`:
  - Registered `UsersController`, `UsersService`, and `UserMapper` as providers

- Added Prisma type utilities (`src/modules/users/types/user.types.ts`):
  - `USER_WITH_ROLE_INCLUDE`: Typed `Prisma.UserInclude` constant (`satisfies` keyword) for queries requiring the role relation
  - `UserWithRole`: Derived `Prisma.UserGetPayload` type representing a user with their `Role` relation included

- Added Data Transfer Objects (`src/modules/users/dto/`):
  - `UserResponseDto`: Response shape — `id`, `firstName`, `lastName`, `email`, `phone`, `role` (code string), `status`, `emailVerifiedAt`, `phoneVerifiedAt`, `lastSeenAt`, `createdAt`, `updatedAt`
  - `UpdateUserDto`: Request body — optional `firstName` and `lastName` fields with `class-validator` constraints (`@MinLength(2)`, `@MaxLength(100)`)

- Added `UserMapper` (`src/modules/users/mappers/user.mapper.ts`):
  - `toResponse(user: UserWithRole): UserResponseDto` — maps Prisma entity to response DTO; resolves `user.role.code` for the `role` field

- Added `UsersService` (`src/modules/users/services/users.service.ts`):
  - `getMe(userId)`: Loads and returns current user profile via `findUserById` + `userMapper.toResponse()`
  - `updateProfile(userId, dto)`: Validates user exists, then runs `prisma.user.update` with partial name fields; returns updated DTO
  - `findUserById(userId)` (private): Shared Prisma lookup with `USER_WITH_ROLE_INCLUDE`; throws `NotFoundException` if not found

- Added `UsersController` (`src/modules/users/controllers/users.controller.ts`):
  - Class-level `@UseGuards(SupabaseAuthGuard)` — all routes require authentication
  - `GET /users/me` → `UsersService.getMe(currentUser.id)`
  - `PATCH /users/me` → `UsersService.updateProfile(currentUser.id, dto)` — accepts `UpdateUserDto` body

- Updated Root Module (`src/app.module.ts`):
  - Added `UsersModule` to the `imports` array

---

## [August 4, 2026]

### Server — Authorization Module (`AuthorizationModule`) Implementation
- Created `AuthorizationModule` (`src/modules/authorization/authorization.module.ts`) providing comprehensive Role-Based Access Control (RBAC) and permission-based authorization:
- Added Metadata Constants (`src/modules/authorization/constants/metadata.constants.ts`):
  - Defined `AUTHORIZATION_METADATA`: `PUBLIC`, `ROLES`, `PERMISSIONS`, `ANY_PERMISSIONS`
- Added Custom Method & Class Decorators (`src/modules/authorization/decorators/`):
  - `@Public()`: Marks route or controller as public (bypasses authorization requirement)
  - `@Roles(...roles)`: Attaches required role codes to handler/class metadata
  - `@Permissions(...permissions)`: Attaches required permission codes (all required - AND condition)
  - `@AnyPermission(...permissions)`: Attaches required permission codes (at least one required - OR condition)
- Added NestJS Guards (`src/modules/authorization/guards/`):
  - `RolesGuard`: Evaluates `@Roles()` metadata against `CurrentUser.hasRole(role)`
  - `PermissionsGuard`: Evaluates `@Permissions()` metadata against `CurrentUser.hasPermission(permission)` (must match all)
  - `AnyPermissionGuard`: Evaluates `@AnyPermission()` metadata against `CurrentUser.hasPermission(permission)` (must match at least one)
- Added Abstract & Concrete Permissions Providers (`src/modules/authorization/`):
  - `PermissionsProvider` abstract interface class (`interfaces/permissions-provider.interface.ts`)
  - `PrismaPermissionsProvider` (`providers/prisma-permissions.provider.ts`) implementing database queries to fetch permission codes for any given role ID via `PrismaService`
- Updated Root Module (`src/app.module.ts`):
  - Registered `AuthModule` and `AuthorizationModule` in `imports` array

---

## [August 3, 2026]

### Server — NestJS Clean Architecture & Infrastructure Reorganization
- Reorganized `server/src` directory structure into clean modular architecture:
  - `src/infrastructure/prisma/` — `PrismaModule` and `PrismaService`
  - `src/infrastructure/supabase/` — `SupabaseModule`, `SupabaseService`, and `supabase.service.spec.ts`
  - `src/common/identity/` — Shared identity models (`CurrentUser`)
  - `src/modules/auth/` — Authentication feature module

### Server — Root Health Endpoint & App Controller
- Created `AppController` (`src/app.controller.ts`) exposing `GET /` health endpoint returning `{ success: true, message: 'aasPass Backend is running successfully 🚀' }`
- Registered `AppController` in `AppModule` (`src/app.module.ts`)

### Server — Supabase Client Extensions
- Extended `SupabaseService` (`src/infrastructure/supabase/supabase.service.ts`):
  - Added `verifyAccessToken(accessToken: string)`: Validates Supabase JWT access token via `anonClient.auth.getUser(accessToken)`
  - Added `getUserById(userId: string)`: Retrieves Supabase auth user by UUID via `adminClient.auth.admin.getUserById(userId)`

### Server — Common Identity Domain Model
- Created `CurrentUser` model (`src/common/identity/current-user.model.ts`):
  - Represents logged-in user context across the application: `id`, `email`, `phone`, `roleId`, `roleCode`, `permissions`, `status`
  - Helper methods: `hasRole(role)`, `hasPermission(permission)`, `isActive()`, `isBlocked()`

### Server — Authentication Guard & Auth Module Implementation
- Created `AuthModule` (`src/modules/auth/auth.module.ts`) importing `PrismaModule` and `SupabaseModule`
- Created `AuthService` (`src/modules/auth/services/auth.service.ts`):
  - Validates Supabase access tokens using `SupabaseService.verifyAccessToken()`
  - Loads application user from PostgreSQL via `PrismaService` with RBAC relations (`role.rolePermissions.permission`)
  - Auto-provisions new users on first login (`syncUser()`) assigning default `CUSTOMER` role
  - Rejects blocked users (`UserStatus.BLOCKED`) with `UnauthorizedException`
- Created `SupabaseAuthGuard` (`src/modules/auth/guards/supabase-auth.guard.ts`):
  - Intercepts requests, extracts `Bearer <token>` from HTTP `Authorization` header
  - Authenticates via `AuthService` and attaches `CurrentUser` instance to `request.user`
- Created `@AuthenticatedUser()` custom param decorator (`src/modules/auth/decorators/authenticated-user.decorator.ts`)
- Created `AuthController` (`src/modules/auth/controllers/auth.controller.ts`):
  - Exposes `GET /auth/me` endpoint protected by `SupabaseAuthGuard` returning authenticated user profile and permissions

---

## [July 28, 2026]

### Documentation — LLD Created (v0.1)
- Created `docs/LLD/lld-v0.1.md` (Low Level Design, v0.1 Draft)
- Documents the actual implementation of all 6 modules:
  - Infrastructure layer: env validation (Zod), config namespaces, bootstrap flow
  - Prisma 7 adapter architecture (`PrismaPg` + `pg.Pool`)
  - Supabase dual-client setup (`anon` + `admin`)
  - Per-module design decisions, data models, and cross-module relationships
  - Order placement flow and inventory adjustment flow diagrams

### Documentation — Data Dictionary Created (v0.1)
- Created `docs/data-dictionary/data-dictionary-v0.1.md` (v0.1 Draft)
- Consolidated single document covering all 6 modules:
  - **26 enums** with PostgreSQL type names and all values
  - **33 tables** with full column definitions (DB type, constraints, defaults, descriptions)
  - All **indexes** per table (name, columns, type, purpose)
  - Summary counts table

### Documentation — Module Database Docs Rewritten
All 6 module docs under `docs/database/` rewritten to match the current schema:

**`docs/database/module1-iam.md` — Complete rewrite:**
- Reflects Supabase auth migration: removed `OTPVerification`, `UserAuthProvider`, `RefreshToken` documentation
- Added `BusinessOTP` model documentation (replaced `OTPVerification`)
- Updated `User` model: removed `passwordHash`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, `lastLoginIp`, `passwordChangedAt`; clarified `id` is not auto-generated (Supabase UUID)
- Updated `OTPPurpose` enum values: replaced old auth values with `ORDER_DELIVERY`, `ORDER_PICKUP`, `ACCOUNT_RECOVERY`, `SENSITIVE_ACTION`
- Added `BusinessOTPReferenceType` enum documentation
- Updated `UserSession`: removed `expiresAt` (managed by Supabase JWT), added `revocationReason` field
- Added "Removed Models" section documenting the migration rationale

**`docs/database/module2-store.md` — Complete rewrite:**
- Added missing indexes: `ownerId`, `verifiedById`, `isOpen`
- Updated `Store` relations to include `carts[]`, `orders[]`, `storeProducts[]`

**`docs/database/module3-catalog.md` — Complete rewrite:**
- Added `Inventory.version` OCC design notes
- Updated `StoreProduct` relations to include `orderItems[]`, `replacementItems[]`
- Corrected all index lists to match current schema

**`docs/database/module4-cart.md` — Complete rewrite:**
- Removed `couponId` (field was dropped; pending Promotions module)
- Added correct composite indexes: `[userId, status]`, `[storeId, status]` on Cart; `[cartId, storeProductId]` on CartItem
- Added snapshot source reference table

**`docs/database/module5-order.md` — Targeted edits:**
- Fixed model count (was `6 models`, now `5 models`)
- Added composite indexes: `[userId, status]`, `[storeId, status]`, `[userId, placedAt]` on `Order`
- Changed `OrderItem` index to composite `[orderId, fulfillmentStatus]`
- Simplified `OrderStatusHistory` and `OrderNote` indexes to `[orderId, createdAt]`

**`docs/database/module6-payment.md` — Targeted edits:**
- Added composite index `[gateway, paymentStatus]` to `Payment`
- Added composite index `[paymentId, transactionStatus]` to `PaymentTransaction`
- Added composite index `[orderId, documentType]` to `FinancialDocument`

### Documentation — `docs/README.md` Updated
- Replaced generic README with a full documentation index
- Links to all doc categories: LLD, Data Dictionary, Architecture, Setup, Guides, Changelog
- Added version conventions table (`v0.x` = Draft, `v1.x` = Approved)
- Added document status legend

---

## [July 25, 2026]

### Module 1 — IAM Schema: Supabase Auth Migration

Authentication fully delegated to **Supabase Auth**. The following models have been **removed** from `module1.auth.prisma`:

| Removed Model | Removed Table | Reason |
|---|---|---|
| `OTPVerification` | `otp_verifications` | Business OTPs replaced by `BusinessOTP`; auth OTPs handled by Supabase |
| `UserAuthProvider` | `user_auth_providers` | OAuth provider links managed by Supabase Auth |
| `RefreshToken` | `refresh_tokens` | Refresh token lifecycle fully managed by Supabase JWT |

**`AuthProvider` enum removed** (`LOCAL`, `GOOGLE`) — no longer needed as Supabase manages OAuth providers.

**`User` model fields removed:**
- `passwordHash`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, `lastLoginIp`, `passwordChangedAt`
- All auth fields now managed by Supabase

**`User.id` changed:** `id` is now set from Supabase Auth's UUID at registration time — `@default(uuid())` removed.

**`UserSession` updated:**
- Removed `expiresAt` — session lifetime managed by Supabase JWT
- Added `revocationReason RevocationReason?` field

**New `OTPPurpose` enum values** (business-context OTPs only):
- Removed: `REGISTRATION`, `LOGIN`, `PASSWORD_RESET`, `PHONE_VERIFICATION`, `EMAIL_VERIFICATION`
- Added: `ORDER_DELIVERY`, `ORDER_PICKUP`, `ACCOUNT_RECOVERY`, `SENSITIVE_ACTION`

**New `BusinessOTPReferenceType` enum added:** `ORDER`, `ACCOUNT`

**New `BusinessOTP` → `business_otps` table added:**
- Replaces `OTPVerification` for business-context flows (delivery/pickup OTP, account recovery, sensitive actions)
- Added `referenceType`, `referenceId` — polymorphic link to business entities
- Added `consumedAt` — distinguishes verified OTPs from acted-upon ones
- `userId` remains nullable for flows where user may not yet exist

### Server — Supabase Client Setup
- Added `@supabase/supabase-js` and `@supabase/ssr`
- Created `SupabaseModule` (`src/infrastructure/supabase/supabase.module.ts`) — Global NestJS module
- Created `SupabaseService` (`src/infrastructure/supabase/supabase.service.ts`):
  - Initializes two clients at startup: `anon` (user-context requests) and `admin` (service role for privileged operations)
  - Both configured with `autoRefreshToken: false` and `persistSession: false` (server-side)
  - `admin` client uses `SUPABASE_SERVICE_ROLE_KEY`; `anon` client uses `SUPABASE_ANON_KEY`

---

## [July 23, 2026]

### Server — Prisma 7 Runtime Fix (Adapter Pattern)
- Diagnosed root cause of `PrismaClientInitializationError`: `PrismaClient` in Prisma v7 no longer accepts an empty `super()` call — the datasource must be passed explicitly at constructor time
- Installed `@prisma/adapter-pg`, `pg`, and `@types/pg`
- Rewrote `PrismaService` (`src/infrastructure/prisma/prisma.service.ts`) to use the Prisma 7 **driver adapter** pattern:
  - Creates a `pg.Pool` from `DATABASE_URL` at construction time
  - Wraps pool in `PrismaPg` adapter
  - Passes `{ adapter }` to `super()` — the correct Prisma 7 constructor signature
  - Implements `OnModuleDestroy` to properly tear down both `$disconnect()` and `pool.end()` — prevents connection leaks
- `schema.prisma` datasource block already has no `url` field (correct for Prisma 7); `prisma.config.ts` continues to supply the URL for CLI commands only

### Server — Removed Orphaned Boilerplate
- Removed `AppController` and `AppService` imports and references from `app.module.ts` — these NestJS CLI-generated stubs were never created as files, causing a `Cannot find module './app.service'` TypeScript error at startup
- `AppModule` now only registers `ConfigModule` (global) and `PrismaModule`

### Server — README Rewrite
- Replaced the default NestJS boilerplate `README.md` with a project-specific reference document covering:
  - Full tech stack table
  - Step-by-step getting started guide
  - Annotated project directory structure
  - Configuration namespace reference
  - Prisma 7 architecture explanation
  - Common Prisma CLI commands
  - Environment variables reference table

---

## [July 22, 2026]

### Global Schema — snake_case Column & Enum Mapping
- Mapped all **26 enums** across Modules 1–6 to snake_case PostgreSQL enum types via `@@map` (e.g. `UserStatus` → `user_status`)
- Mapped all camelCase scalar fields across every model in Modules 1–6 to snake_case column names via `@map` (e.g. `createdBy` → `created_by`, `firstName` → `first_name`)

### Module 2 — Store Schema Updates
- Defined single source of truth for Store Availability & Checkout evaluation rule:
  `CanCheckout = (Store.status == ACTIVE) AND (Store.isOpen == true) AND (CurrentTime in StoreHour)`
- Removed unused `StoreImageType` enum
- Established mandatory service-layer creation contract for `StoreDeliverySetting` — must be created atomically within the same transaction as `Store`
- Replaced `logoUrl`, `bannerUrl`, `imageUrl` with `logoKey`, `bannerKey`, `objectKey` (`VarChar(500)`) across `Store` and `StoreImage` — aligns with `Category`, `Brand`, and `ProductImage` object-storage key pattern
- Removed unreferenced rating aggregate fields `averageRating` and `totalReviews` from `Store` model pending dedicated Review module implementation

### Module 3 — Catalog & Inventory Schema Updates
- Added `version Int @default(0)` field to `Inventory` model in `module3.catalog.prisma` for Optimistic Concurrency Control to prevent overselling and lost updates during simultaneous checkouts

### Module 4 — Cart Schema Updates
- Removed unused `couponId` placeholder field from `Cart` model in `module4.cart.prisma` — pending dedicated Coupon module implementation

### Module 5 — Order Management Schema Updates
- Added `version Int @default(0)` field to `Order` model in `module5.order.prisma` for Optimistic Concurrency Control during concurrent order status transitions

### Module 6 — Payment & Financial Management Schema Updates
- Added `@@unique([gateway, gatewayPaymentId])` constraint to `PaymentTransaction` model in `module6.payment.prisma` to prevent duplicate transaction entries per gateway

---

## [July 21, 2026]

### Module 6 — Payment & Financial Management Schema
**Added Enums:**
- `PaymentMethod` — `COD`, `UPI`, `CARD`, `NET_BANKING`, `WALLET`
- `PaymentStatus` — `PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `CANCELLED`, `PARTIALLY_REFUNDED`, `REFUNDED`
- `PaymentGateway` — `RAZORPAY`, `CASH`
- `PaymentTransactionStatus` — `INITIATED`, `SUCCESS`, `FAILED`, `CANCELLED`
- `RefundStatus` — `PENDING`, `PROCESSED`, `FAILED`
- `FinancialDocumentType` — `INVOICE`, `RECEIPT`, `CREDIT_NOTE`

**Added Models:**

`Payment` → `payments` — One-to-one with `Order`. Tracks `payableAmount`, `paidAmount`, `refundedAmount`. Cascade delete with `Order`.

`PaymentTransaction` → `payment_transactions` — Individual gateway charge attempts (append-only). Captures `gatewayOrderId`, `gatewayPaymentId`, `gatewaySignature` for Razorpay verification. Stores raw `gatewayResponse` JSON and `failureReason`.

`Refund` → `refunds` — Partial and full refund tracking per payment. `gatewayRefundId` for gateway reconciliation.

`PaymentWebhook` → `payment_webhooks` — Idempotent webhook event storage (`@@unique([gatewayEventId])`). `isProcessed` flag with `processingError` for dead-letter retry patterns.

`FinancialDocument` → `financial_documents` — Invoice, receipt, and credit note tracking. `documentNumber` unique for tax-compliant sequential numbering. `pdfKey` for object storage.

**Updated Existing Models:**
- `Order` — added `payment Payment?` and `financialDocuments FinancialDocument[]` reverse relations

---

### Module 5 — Order Management Schema
**Added Enums:**
- `OrderStatus` — `PENDING`, `CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `FAILED`
- `FulfillmentType` — `DELIVERY`, `PICKUP`
- `FulfillmentStatus` — `PENDING`, `CONFIRMED`, `REPLACED`, `CANCELLED`, `DELIVERED`
- `ReplacementStatus` — `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`
- `OrderNoteType` — `CUSTOMER`, `MERCHANT`, `SYSTEM`, `DELIVERY_PARTNER`

**Added Models:**

`Order` → `orders` — Per-store order with full delivery address snapshot (13 address fields frozen at placement). Pricing breakdown: `subtotal`, `discountAmount`, `taxAmount`, `deliveryFee`, `totalAmount`. Lifecycle timestamps: `placedAt`, `confirmedAt`, `packedAt`, `outForDeliveryAt`, `deliveredAt`, `cancelledAt`. `Restrict` FK on `User`, `Store`, and `Address`.

`OrderItem` → `order_items` — Line items with product/price snapshots and per-item `fulfillmentStatus`. Supports partial fulfillment workflows.

`OrderItemReplacement` → `order_item_replacements` — Merchant-initiated product substitution with full replacement pricing snapshots. `merchantReason` and `customerResponse` for two-way communication.

`OrderStatusHistory` → `order_status_history` — Immutable audit trail (append-only, no `updatedAt`). Captures `previousStatus` → `newStatus` with optional `remarks`.

`OrderNote` → `order_notes` — Multi-party notes from customer, merchant, system, and delivery partner. Append-only.

**Updated Existing Models:**
- `User` — added `orders Order[]`
- `Address` — added `orders Order[]`
- `Store` — added `orders Order[]`
- `StoreProduct` — added `orderItems OrderItem[]` and `orderItemReplacements OrderItemReplacement[]`

---

### Module 4 — Cart & Wishlist Schema
**Added Enums:**
- `CartStatus` — `ACTIVE`, `CHECKED_OUT`, `ABANDONED`, `EXPIRED`

**Added Models:**

`Cart` → `carts` — One active cart per user per store (`@@unique([userId, storeId])`). Full pricing breakdown. `expiresAt` for TTL/abandonment policies. Soft-delete via `deletedAt`.

`CartItem` → `cart_items` — Line items with product/price snapshots frozen at add-to-cart time (`productNameSnapshot`, `unitSnapshot`, `mrpSnapshot`, `sellingPriceSnapshot`, `gstRateSnapshot`). `@@unique([cartId, storeProductId])`.

`Wishlist` → `wishlists` — Named bookmark lists with `isDefault` flag. `@@unique([userId, name])`. Soft-delete via `deletedAt`.

`WishlistItem` → `wishlist_items` — Lightweight bookmarks, no price snapshots (live prices at render time). `@@unique([wishlistId, storeProductId])`.

**Updated Existing Models:**
- `User` — added `carts Cart[]` and `wishlists Wishlist[]`
- `Store` — added `carts Cart[]`
- `StoreProduct` — added `cartItems CartItem[]` and `wishlistItems WishlistItem[]`

---

## [July 20, 2026]

### Module 3 — Catalog & Inventory Schema
**Added Enums:**
- `ProductStatus` — `ACTIVE`, `INACTIVE`, `DISCONTINUED`
- `ProductImageType` — `PRIMARY`, `GALLERY`
- `AvailabilityStatus` — `AVAILABLE`, `OUT_OF_STOCK`, `HIDDEN`, `DISCONTINUED`
- `InventoryTransactionType` — `PURCHASE`, `SALE`, `RETURN`, `RESTOCK`, `ADJUSTMENT`, `DAMAGE`, `EXPIRED`
- `InventoryReferenceType` — `ORDER`, `PURCHASE`, `RETURN`, `MANUAL`

**Added Models:**

`Category` → `categories` — Self-referencing hierarchy via `CategoryHierarchy` relation. `SetNull` on parent delete. `imageKey` and `iconKey` for object storage. Soft-delete via `deletedAt`.

`Brand` → `brands` — Platform-wide brand registry. `logoKey` for object storage. Soft-delete via `deletedAt`.

`Unit` → `units` — Units of measure with unique `name` and `symbol`. Soft-delete via `deletedAt`.

`MasterProduct` → `master_products` — Canonical platform product shared across all stores. `sku` + `barcode` for identification. `hsnCode` + `gstRate` for GST. `unitValue` for quantity per unit. `isVeg` tri-state (`true`/`false`/`null`). `searchVector` (`tsvector`) for full-text search. `Restrict` FK on `categoryId` and `unitId`; `SetNull` on `brandId`.

`ProductImage` → `product_images` — `PRIMARY` and `GALLERY` types. `objectKey` stores storage path (CDN URL assembled at read time). Cascade delete with `MasterProduct`.

`StoreProduct` → `store_products` — Per-store listing with custom `mrp` and `sellingPrice`. `@@unique([storeId, masterProductId])`. `trackInventory` toggle for made-to-order items. Soft-delete via `deletedAt`.

`Inventory` → `inventory` — One-to-one with `StoreProduct`. Tracks `stockQuantity`, `reservedQuantity`, `lowStockThreshold`, `reorderLevel`. Cascade delete with `StoreProduct`.

`InventoryTransaction` → `inventory_transactions` — Write-once immutable ledger (no `updatedAt`). Signed `quantity` field. `balanceAfterTransaction` snapshot. Polymorphic `referenceType` + `referenceId` link. Cascade delete with `Inventory`.

---

### Module 2 — Store Schema (Complete)
**Added Models:**

`StoreHour` → `store_hours` — Per-day operating hours (`@@unique([storeId, weekDay])`). `isClosed` flag. `openingTime`/`closingTime` stored as `Time(6)`, nullable.

`StoreDeliverySetting` → `store_delivery_settings` — One-to-one with `Store`. Delivery/pickup toggles. `minimumOrderAmount`, `deliveryCharge`, `freeDeliveryAbove`, `deliveryRadiusKm`. `estimatedDeliveryTime` in minutes (default: 30).

---

## [July 17, 2026]

### Module 2 — Store Schema (Partial)
**Added Enums:**
- `StoreStatus` — `PENDING`, `ACTIVE`, `TEMPORARILY_CLOSED`, `SUSPENDED`, `CLOSED`
- `VerificationStatus` — `PENDING`, `VERIFIED`, `REJECTED`
- `WeekDay` — `MONDAY` through `SUNDAY`

**Added Models:**

`Store` → `stores` — One store per user (`ownerId` unique). Full address with indexed GPS coordinates. Business info: `gstNumber`, `businessRegistrationNumber`. Dual status: `StoreStatus` (operational) + `VerificationStatus` (document approval). Named relations: `StoreOwner` and `StoreVerifier`. Denormalized `averageRating` + `totalReviews`. Soft-delete via `deletedAt`.

`StoreImage` → `store_images` — Gallery images with `displayOrder`.

**Updated Existing Models:**
- `User` — added `ownedStore Store?` and `verifiedStores Store[]`

---

## [July 16, 2026]

### Module 1 — IAM Schema (Initial — superseded by July 25 Supabase migration)

> ⚠️ The models listed below were partially replaced by the Supabase auth migration on July 25, 2026. See that entry for details.

**Added Models:**

`User` → `users` — Phone-first account with optional email. Included `passwordHash`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, `lastLoginIp` (**removed in July 25 migration**). `UserStatus` lifecycle. `lastSeenAt`. Soft-delete via `deletedAt`.

`Address` → `addresses` — Full delivery/billing address with receiver details. GPS coordinates. `isDefault` flag. Soft-delete via `deletedAt`.

`OTPVerification` → `otp_verifications` (**removed in July 25 migration**) — All OTP purposes: `REGISTRATION`, `LOGIN`, `PASSWORD_RESET`, `PHONE_VERIFICATION`, `EMAIL_VERIFICATION`. SMS and EMAIL delivery. Rate-limiting: `attempts`, `maxAttempts`, `blockedUntil`. Nullable `userId` for pre-registration OTPs. Hash-only storage.

`UserAuthProvider` → `user_auth_providers` (**removed in July 25 migration**) — OAuth provider links. `@@unique([provider, providerUserId])`.

`UserSession` → `user_sessions` — One session per login per device. Tracks `deviceType`, `deviceName`, `deviceId`, `ipAddress`, `userAgent`, `lastActivityAt`. Originally had `expiresAt` (**removed in July 25 migration**).

`RefreshToken` → `refresh_tokens` (**removed in July 25 migration**) — Hashed tokens only (never raw). Supports token rotation with `RevocationReason`. Tracks `revokedAt` and `revokedReason`.

**Updated Existing Models:**
- `Role` — added `@@index([isActive])`
- `Permission` — added `@@index([isActive])`

**Schema Restructure:**
- IAM schema moved to `prisma/modules/module1.auth.prisma`

---

## [July 15, 2026]

### Foundation & Initial IAM Schema
- NestJS server scaffolded with `@nestjs/cli`
- PostgreSQL + Prisma ORM configured (`schema.prisma`, `prisma.config.ts`)
- Split schema architecture — 6 module-specific files under `prisma/modules/`
- **Initial IAM schema (RBAC layer):**
  - `Role` → `roles` table
  - `Permission` → `permissions` table
  - `RolePermission` → `role_permissions` table
  - 6 enums: `UserStatus`, `OTPPurpose`, `OTPChannel`, `AuthProvider`, `DeviceType`, `RevocationReason`
- Full dependency stack installed (JWT, BullMQ, Redis, Socket.io, Swagger, Helmet, etc.)

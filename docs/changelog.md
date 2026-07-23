# Changelog

> [← Back to Index](../README.md)

All notable changes to this project are documented here.

---

## [July 23, 2026]

### Server — Prisma 7 Runtime Fix (Adapter Pattern)
- Diagnosed root cause of `PrismaClientInitializationError`: `PrismaClient` in Prisma v7 no longer accepts an empty `super()` call — the datasource must be passed explicitly at constructor time
- Installed `@prisma/adapter-pg`, `pg`, and `@types/pg`
- Rewrote `PrismaService` (`src/prisma/prisma.service.ts`) to use the Prisma 7 **driver adapter** pattern:
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
- Mapped all **27 enums** across Modules 1–6 to snake_case PostgreSQL enum types via `@@map` (e.g. `UserStatus` → `user_status`)
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
- Removed unused `couponId` placeholder field from `Cart` model in `module4.cart.prisma` and `schema.prisma` pending dedicated Coupon module implementation

### Module 5 — Order Management Schema Updates
- Added `version Int @default(0)` field to `Order` model in `module5.order.prisma` and `schema.prisma` for Optimistic Concurrency Control during concurrent order status transitions

### Module 6 — Payment & Financial Management Schema Updates
- Added `@@unique([gateway, gatewayPaymentId])` constraint to `PaymentTransaction` model in `module6.payment.prisma` and `schema.prisma` to prevent duplicate transaction entries per gateway

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

`Cart` → `carts` — One active cart per user per store (`@@unique([userId, storeId])`). Full pricing breakdown. `couponId` placeholder for future promotions. `expiresAt` for TTL/abandonment policies. Soft-delete via `deletedAt`.

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

### Module 1 — IAM Schema Complete
**Added Models:**

`User` → `users` — Phone-first account with optional email. bcrypt password hash. `UserStatus` lifecycle. Brute-force protection: `failedLoginAttempts`, `lockedUntil`. Login tracking: `lastLoginAt`, `lastLoginIp`, `lastSeenAt`. Soft-delete via `deletedAt`.

`Address` → `addresses` — Full delivery/billing address with receiver details. GPS coordinates. `isDefault` flag. Soft-delete via `deletedAt`.

`OTPVerification` → `otp_verifications` — All OTP purposes: `REGISTRATION`, `LOGIN`, `PASSWORD_RESET`, `PHONE_VERIFICATION`, `EMAIL_VERIFICATION`. SMS and EMAIL delivery. Rate-limiting: `attempts`, `maxAttempts`, `blockedUntil`. Nullable `userId` for pre-registration OTPs. Hash-only storage.

`UserAuthProvider` → `user_auth_providers` — OAuth provider links. `@@unique([provider, providerUserId])`.

`UserSession` → `user_sessions` — One session per login per device. Tracks `deviceType`, `deviceName`, `deviceId`, `ipAddress`, `userAgent`, `lastActivityAt`, `expiresAt`.

`RefreshToken` → `refresh_tokens` — Hashed tokens only (never raw). Supports token rotation with `RevocationReason`. Tracks `revokedAt` and `revokedReason`.

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

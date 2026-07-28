# Database — Module 3: Catalog & Inventory

> [← Back to Index](../README.md)  
> **Schema file:** [`server/prisma/modules/module3.catalog.prisma`](../../server/prisma/modules/module3.catalog.prisma)  
> **Status:** ✅ Schema Complete (8 models)  
> **Last Updated:** 2026-07-28

---

## Overview

The Catalog module manages the entire product catalogue and inventory layer for the marketplace:

- Hierarchical product **categories** (unlimited nesting via self-relation)
- **Brands** for product classification
- **Units of measure** (kg, litre, piece, etc.)
- **Master products** — a shared, platform-level product catalogue
- **Store products** — per-store pricing and availability overrides on master products
- **Product images** (primary + gallery)
- **Inventory** tracking per store product (stock, reserved, low-stock thresholds, OCC version)
- **Inventory transactions** — an immutable audit ledger of every stock movement

---

## Enums

> All enums are mapped to snake_case PostgreSQL enum types via `@@map`.

### `ProductStatus` → `product_status`
Lifecycle state of a master product.

| Value | Description |
|---|---|
| `ACTIVE` | Product is live and visible |
| `INACTIVE` | Product is hidden / not sold |
| `DISCONTINUED` | Product permanently removed from sale |

---

### `ProductImageType` → `product_image_type`
Classifies images attached to a master product.

| Value | Description |
|---|---|
| `PRIMARY` | The main display image |
| `GALLERY` | Additional gallery images |

---

### `AvailabilityStatus` → `availability_status`
Per-store availability state of a product listing.

| Value | Description |
|---|---|
| `AVAILABLE` | In stock and visible to customers |
| `OUT_OF_STOCK` | Stock depleted, still visible |
| `HIDDEN` | Manually hidden by the store owner |
| `DISCONTINUED` | Store has stopped selling this product |

---

### `InventoryTransactionType` → `inventory_transaction_type`
Reason/type for each inventory stock movement.

| Value | Description |
|---|---|
| `PURCHASE` | Stock added via a purchase order |
| `SALE` | Stock decremented on order placement |
| `RETURN` | Stock restored after a customer return |
| `RESTOCK` | Manual restock event |
| `ADJUSTMENT` | Correction/reconciliation entry |
| `DAMAGE` | Stock written off due to damage |
| `EXPIRED` | Stock written off due to expiry |

---

### `InventoryReferenceType` → `inventory_reference_type`
The source entity that triggered a stock movement.

| Value | Description |
|---|---|
| `ORDER` | Linked to an order |
| `PURCHASE` | Linked to a purchase record |
| `RETURN` | Linked to a return record |
| `MANUAL` | No linked entity (manual adjustment) |

---

## Models

> All models map to snake_case PostgreSQL table names via `@@map`. All camelCase fields map to snake_case column names via `@map`.

### `Category` → `categories` table

Hierarchical product category tree. A category may have a parent category, enabling unlimited nesting (e.g. Food → Beverages → Cold Drinks).

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `parentCategoryId` | `parent_category_id` | UUID? | FK → `categories.id`, SetNull, Indexed | Parent category (`null` = root category) |
| `name` | `name` | VarChar(150) | Required | Display name |
| `slug` | `slug` | VarChar(170) | Unique, Indexed | URL-friendly identifier |
| `description` | `description` | Text? | Optional | Category description |
| `imageKey` | `image_key` | VarChar(500)? | Optional | Object storage key for category image |
| `iconKey` | `icon_key` | VarChar(500)? | Optional | Object storage key for category icon |
| `sortOrder` | `sort_order` | Int | Default: `0`, Indexed | Display ordering in listings |
| `isActive` | `is_active` | Boolean | Default: `true`, Indexed | Soft-disable |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz(6)? | Optional | Soft-delete timestamp |

**Indexes:** `@@index([parentCategoryId])`, `@@index([slug])`, `@@index([isActive])`, `@@index([sortOrder])`  
**Relations:** `parentCategory → Category?` (via `CategoryHierarchy`), `subCategories → Category[]` (via `CategoryHierarchy`), `products → MasterProduct[]`

> **Design Note:** On parent category delete, child categories receive `SetNull` on `parentCategoryId` — they become root categories rather than being deleted. This preserves the product hierarchy.

---

### `Brand` → `brands` table

Platform-wide brand registry. Brands can be shared across all stores and products.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `name` | `name` | VarChar(150) | Required | Brand display name |
| `slug` | `slug` | VarChar(170) | Unique, Indexed | URL-friendly identifier |
| `logoKey` | `logo_key` | VarChar(500)? | Optional | Object storage key for brand logo |
| `isActive` | `is_active` | Boolean | Default: `true`, Indexed | Soft-disable |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz(6)? | Optional | Soft-delete timestamp |

**Indexes:** `@@index([slug])`, `@@index([isActive])`  
**Relations:** `products → MasterProduct[]`

---

### `Unit` → `units` table

Units of measurement. Unique `name` and `symbol` ensure no duplicate units.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `name` | `name` | VarChar(100) | Unique | Full unit name (e.g. "Kilogram") |
| `symbol` | `symbol` | VarChar(20) | Unique | Short symbol (e.g. "kg") |
| `description` | `description` | Text? | Optional | Optional description |
| `isActive` | `is_active` | Boolean | Default: `true`, Indexed | Soft-disable |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz(6)? | Optional | Soft-delete timestamp |

**Indexes:** `@@index([isActive])`  
**Relations:** `products → MasterProduct[]`

---

### `MasterProduct` → `master_products` table

Canonical, platform-wide product definition. Shared across all stores — stores add their own pricing via `StoreProduct`. Created and managed by platform admins.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `categoryId` | `category_id` | UUID | FK → `categories.id`, Restrict, Indexed | Product category |
| `brandId` | `brand_id` | UUID? | FK → `brands.id`, SetNull, Indexed | Product brand (optional) |
| `unitId` | `unit_id` | UUID | FK → `units.id`, Restrict, Indexed | Measurement unit |
| `name` | `name` | VarChar(200) | Required | Product name |
| `slug` | `slug` | VarChar(220) | Unique, Indexed | URL-friendly identifier |
| `description` | `description` | Text? | Optional | Product description |
| `sku` | `sku` | VarChar(100) | Unique, Indexed | Stock Keeping Unit code |
| `barcode` | `barcode` | VarChar(100)? | Unique, Indexed | EAN/UPC barcode |
| `hsnCode` | `hsn_code` | VarChar(20)? | Optional | HSN code for GST classification |
| `gstRate` | `gst_rate` | Decimal(5,2) | Default: `0.00` | GST rate percentage |
| `unitValue` | `unit_value` | Decimal(10,2) | Required | Quantity per unit (e.g. 500 for 500g) |
| `isVeg` | `is_veg` | Boolean? | Optional (`null` = not applicable) | Vegetarian indicator |
| `isFeatured` | `is_featured` | Boolean | Default: `false`, Indexed | Pinned to featured listings |
| `status` | `status` | `ProductStatus` | Default: `ACTIVE`, Indexed | Product lifecycle status |
| `searchVector` | `search_vector` | tsvector? | Optional | PostgreSQL full-text search vector |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz(6)? | Optional | Soft-delete timestamp |

**Indexes:** `@@index([categoryId])`, `@@index([brandId])`, `@@index([unitId])`, `@@index([status])`, `@@index([isFeatured])`, `@@index([slug])`, `@@index([sku])`, `@@index([barcode])`  
*(Planned)* `GIN` index on `searchVector` for full-text search  
**Relations:** `category`, `brand?`, `unit`, `images → ProductImage[]`, `storeProducts → StoreProduct[]`

> **Design Notes:**
> - `categoryId` and `unitId` use `Restrict` — master product cannot be deleted by cascading category/unit delete
> - `brandId` uses `SetNull` — brand deletion doesn't cascade to products
> - `isVeg` is a tri-state: `true` = vegetarian, `false` = non-vegetarian, `null` = not applicable (e.g. electronics)
> - `searchVector` is a `tsvector` (Prisma `Unsupported` type) populated by a DB trigger or generated column

---

### `ProductImage` → `product_images` table

Images for a master product. Supports primary and gallery image types.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `masterProductId` | `master_product_id` | UUID | FK → `master_products.id`, Cascade, Indexed | Owner product |
| `objectKey` | `object_key` | VarChar(500) | Required | Object storage key |
| `imageType` | `image_type` | `ProductImageType` | Required | `PRIMARY` or `GALLERY` |
| `isPrimary` | `is_primary` | Boolean | Default: `false`, Indexed | Whether this is the primary display image |
| `displayOrder` | `display_order` | Int | Default: `1`, Indexed | Gallery display sequence |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |

**Indexes:** `@@index([masterProductId])`, `@@index([masterProductId, displayOrder])`, `@@index([masterProductId, isPrimary])`

---

### `StoreProduct` → `store_products` table

Per-store product listing. References a `MasterProduct` and adds store-specific pricing and availability. `@@unique([storeId, masterProductId])` ensures each product is listed at most once per store.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `storeId` | `store_id` | UUID | FK → `stores.id`, Cascade, Indexed | The store listing this product |
| `masterProductId` | `master_product_id` | UUID | FK → `master_products.id`, Restrict, Indexed | The master product reference |
| `mrp` | `mrp` | Decimal(10,2) | Required | Maximum Retail Price |
| `sellingPrice` | `selling_price` | Decimal(10,2) | Required | Actual selling price |
| `availabilityStatus` | `availability_status` | `AvailabilityStatus` | Default: `AVAILABLE`, Indexed | Stock/availability status |
| `trackInventory` | `track_inventory` | Boolean | Default: `true` | Whether to track inventory (false for made-to-order) |
| `isFeatured` | `is_featured` | Boolean | Default: `false`, Indexed | Pinned in store's featured section |
| `displayOrder` | `display_order` | Int | Default: `0` | Display ordering within the store |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz(6)? | Optional | Soft-delete timestamp |

**Constraints:** `@@unique([storeId, masterProductId])`  
**Indexes:** `@@index([storeId])`, `@@index([masterProductId])`, `@@index([availabilityStatus])`, `@@index([isFeatured])`, `@@index([storeId, availabilityStatus])`, `@@index([storeId, isFeatured])`  
**Relations:** `store`, `masterProduct`, `inventory → Inventory?`, `cartItems → CartItem[]`, `wishlistItems → WishlistItem[]`, `orderItems → OrderItem[]` (via `OrderedProduct`), `replacementItems → OrderItemReplacement[]` (via `ReplacementProduct`)

---

### `Inventory` → `inventory` table

Per-store-product inventory record. One-to-one with `StoreProduct`. Uses optimistic concurrency control (`version`) to prevent overselling.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `storeProductId` | `store_product_id` | UUID | Unique FK → `store_products.id`, Cascade | One inventory per store product |
| `stockQuantity` | `stock_quantity` | Int | Default: `0`, Indexed | Total units in stock |
| `reservedQuantity` | `reserved_quantity` | Int | Default: `0` | Units reserved for pending/confirmed orders |
| `lowStockThreshold` | `low_stock_threshold` | Int | Default: `10` | Alert threshold for low stock |
| `reorderLevel` | `reorder_level` | Int | Default: `20` | Level to trigger restock |
| `version` | `version` | Int | Default: `0` | Optimistic Concurrency Control version counter |
| `lastStockUpdate` | `last_stock_update` | Timestamptz(6)? | Optional, Indexed | Timestamp of last stock change |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |

**Indexes:** `@@index([stockQuantity])`, `@@index([lastStockUpdate])`

> **Design Notes:**
> - **Available Stock** = `stockQuantity - reservedQuantity`
> - **OCC:** Service reads `version`, applies update with `WHERE version = ?`. Zero rows affected = concurrent modification detected. Service retries or rejects.
> - `reservedQuantity` is incremented when an order is placed (pending payment) and decremented when the order is confirmed or cancelled.

---

### `InventoryTransaction` → `inventory_transactions` table

Immutable, append-only ledger of every stock movement. No `updatedAt` — records are never modified after creation.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `inventoryId` | `inventory_id` | UUID | FK → `inventory.id`, Cascade, Indexed | Associated inventory record |
| `transactionType` | `transaction_type` | `InventoryTransactionType` | Required, Indexed | Type of stock movement |
| `quantity` | `quantity` | Int | Required | Units changed (positive = stock in, negative = stock out) |
| `balanceAfterTransaction` | `balance_after_transaction` | Int | Required | Stock balance snapshot after this transaction |
| `referenceType` | `reference_type` | `InventoryReferenceType`? | Optional, Indexed | Type of source entity |
| `referenceId` | `reference_id` | UUID? | Optional | ID of source entity (order, purchase, etc.) |
| `source` | `source` | VarChar(100)? | Optional | Source system or service name |
| `notes` | `notes` | Text? | Optional | Free-text notes |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Transaction timestamp |

**Indexes:** `@@index([inventoryId])`, `@@index([transactionType])`, `@@index([referenceType])`, `@@index([referenceType, referenceId])`, `@@index([createdAt])`

> **Design Note:** `balanceAfterTransaction` is a snapshot — it enables historical reconstruction of inventory state at any point without needing to sum all prior transactions.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    Category {
        uuid id PK
        uuid parentCategoryId FK
        string slug UK
        bool isActive
        int sortOrder
    }
    Brand {
        uuid id PK
        string slug UK
        bool isActive
    }
    Unit {
        uuid id PK
        string name UK
        string symbol UK
        bool isActive
    }
    MasterProduct {
        uuid id PK
        uuid categoryId FK
        uuid brandId FK
        uuid unitId FK
        string slug UK
        string sku UK
        string barcode UK
        ProductStatus status
        bool isFeatured
        tsvector searchVector
    }
    ProductImage {
        uuid id PK
        uuid masterProductId FK
        string objectKey
        ProductImageType imageType
        bool isPrimary
        int displayOrder
    }
    StoreProduct {
        uuid id PK
        uuid storeId FK
        uuid masterProductId FK
        decimal mrp
        decimal sellingPrice
        AvailabilityStatus availabilityStatus
        bool trackInventory
    }
    Inventory {
        uuid id PK
        uuid storeProductId FK_UK
        int stockQuantity
        int reservedQuantity
        int lowStockThreshold
        int reorderLevel
        int version
    }
    InventoryTransaction {
        uuid id PK
        uuid inventoryId FK
        InventoryTransactionType transactionType
        int quantity
        int balanceAfterTransaction
        datetime createdAt
    }

    Category ||--o{ Category : "parent of"
    Category ||--o{ MasterProduct : "classifies"
    Brand ||--o{ MasterProduct : "brands"
    Unit ||--o{ MasterProduct : "measures"
    MasterProduct ||--o{ ProductImage : "has"
    MasterProduct ||--o{ StoreProduct : "listed as"
    StoreProduct ||--o| Inventory : "has"
    Inventory ||--o{ InventoryTransaction : "ledger"
```

---

## Model Summary

| Model | Table | Records Represent |
|---|---|---|
| `Category` | `categories` | Hierarchical product categories |
| `Brand` | `brands` | Product brands |
| `Unit` | `units` | Units of measurement |
| `MasterProduct` | `master_products` | Platform-level product definitions |
| `ProductImage` | `product_images` | Product gallery/primary images |
| `StoreProduct` | `store_products` | Per-store product listing with custom pricing |
| `Inventory` | `inventory` | Stock levels per store product (OCC-enabled) |
| `InventoryTransaction` | `inventory_transactions` | Immutable stock movement ledger |

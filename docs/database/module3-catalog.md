# Database — Module 3: Catalog & Inventory

> [← Back to Index](../README.md)  
> **Schema file:** [`server/prisma/modules/module3.catalog.prisma`](../../server/prisma/modules/module3.catalog.prisma)  
> **Status:** ✅ Schema Complete (8 models)

---

## Overview

The Catalog module manages the entire product catalogue and inventory layer for the marketplace:

- Hierarchical product **categories** (unlimited nesting via self-relation)
- **Brands** for product classification
- **Units of measure** (kg, litre, piece, etc.)
- **Master products** — a shared, platform-level product catalogue
- **Store products** — per-store pricing and availability overrides on master products
- **Product images** (primary + gallery)
- **Inventory** tracking per store product (stock, reserved, low-stock thresholds)
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
Reason / type for each inventory stock movement.

| Value | Description |
|---|---|
| `PURCHASE` | Stock added via a purchase order |
| `SALE` | Stock decremented on order placement |
| `RETURN` | Stock restored after a customer return |
| `RESTOCK` | Manual restock event |
| `ADJUSTMENT` | Correction / reconciliation entry |
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

Hierarchical product category tree. A category may have a parent category, enabling unlimited nesting (e.g. Food -> Beverages -> Cold Drinks).

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `parentCategoryId` | `parent_category_id` | UUID? | FK -> `categories.id`, SetNull, Indexed | Parent category (`null` = root category) |
| `name` | `name` | VarChar(150) | Required | Display name |
| `slug` | `slug` | VarChar(170) | Unique, Indexed | URL-friendly identifier |
| `description` | `description` | Text? | Optional | Category description |
| `imageKey` | `image_key` | VarChar(500)? | Optional | Object storage key for category image |
| `iconKey` | `icon_key` | VarChar(500)? | Optional | Object storage key for category icon |
| `sortOrder` | `sort_order` | Int | Default: `0`, Indexed | Controls display order in listings |
| `isActive` | `is_active` | Boolean | Default: `true`, Indexed | Soft-disable a category |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz? | Optional | Soft-delete timestamp |

**Indexes:** `@@index([parentCategoryId])`, `@@index([slug])`, `@@index([isActive])`, `@@index([sortOrder])`  
**Relations:**
- `parentCategory -> Category?` (self-relation: `CategoryHierarchy`)
- `subCategories -> Category[]` (self-relation: `CategoryHierarchy`)
- `products -> MasterProduct[]`

> **Design Note:** Self-referencing `CategoryHierarchy` relation allows arbitrary category depth. `onDelete: SetNull` on `parentCategoryId` means deleting a parent category detaches (but does not delete) its children, preventing accidental data loss.

---

### `Brand` → `brands` table

Represents a product brand. Brands are shared across all stores.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `name` | `name` | VarChar(150) | Required | Brand display name |
| `slug` | `slug` | VarChar(170) | Unique, Indexed | URL-friendly identifier |
| `logoKey` | `logo_key` | VarChar(500)? | Optional | Object storage key for brand logo |
| `isActive` | `is_active` | Boolean | Default: `true`, Indexed | Soft-disable a brand |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz? | Optional | Soft-delete timestamp |

**Indexes:** `@@index([slug])`, `@@index([isActive])`  
**Relations:** `products -> MasterProduct[]`

---

### `Unit` → `units` table

Units of measure (e.g. `kg`, `litre`, `piece`, `dozen`). Used to indicate the quantity denomination of a master product.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `name` | `name` | VarChar(100) | Unique | Full unit name (e.g. `Kilogram`) |
| `symbol` | `symbol` | VarChar(20) | Unique | Short symbol (e.g. `kg`) |
| `description` | `description` | Text? | Optional | Description of the unit |
| `isActive` | `is_active` | Boolean | Default: `true`, Indexed | Soft-disable a unit |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz? | Optional | Soft-delete timestamp |

**Indexes:** `@@index([isActive])`  
**Relations:** `products -> MasterProduct[]`

---

### `MasterProduct` → `master_products` table

Platform-level product definition. A master product is the canonical record for a product — shared across all stores. Stores do **not** create their own products from scratch; they list store-specific prices and availability on top of master products.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `categoryId` | `category_id` | UUID | FK -> `categories.id`, Restrict, Indexed | Product category |
| `brandId` | `brand_id` | UUID? | FK -> `brands.id`, SetNull, Indexed | Brand (optional) |
| `unitId` | `unit_id` | UUID | FK -> `units.id`, Restrict, Indexed | Unit of measure |
| `name` | `name` | VarChar(200) | Required | Product name |
| `slug` | `slug` | VarChar(220) | Unique, Indexed | URL-friendly identifier |
| `description` | `description` | Text? | Optional | Product description |
| `sku` | `sku` | VarChar(100) | Unique, Indexed | Stock Keeping Unit code |
| `barcode` | `barcode` | VarChar(100)? | Unique, Indexed | EAN / UPC barcode |
| `hsnCode` | `hsn_code` | VarChar(20)? | Optional | HSN code for GST classification |
| `gstRate` | `gst_rate` | Decimal(5,2) | Default: `0.00` | GST percentage applied |
| `unitValue` | `unit_value` | Decimal(10,2) | Required | Quantity per unit (e.g. `500` for 500g) |
| `isVeg` | `is_veg` | Boolean? | Optional | `true` = veg, `false` = non-veg, `null` = N/A |
| `isFeatured` | `is_featured` | Boolean | Default: `false`, Indexed | Pin product to featured sections |
| `status` | `status` | `ProductStatus` | Default: `ACTIVE`, Indexed | Product lifecycle state |
| `searchVector` | `search_vector` | tsvector? | Optional | PostgreSQL full-text search vector |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz? | Optional | Soft-delete timestamp |

**Indexes:** `@@index([categoryId])`, `@@index([brandId])`, `@@index([unitId])`, `@@index([status])`, `@@index([isFeatured])`, `@@index([slug])`, `@@index([sku])`, `@@index([barcode])`  
**Relations:**
- `category -> Category`
- `brand -> Brand?`
- `unit -> Unit`
- `images -> ProductImage[]`
- `storeProducts -> StoreProduct[]`

> **Design Notes:**
> - `categoryId` and `unitId` use `Restrict` on delete — you cannot delete a category or unit that is still referenced by products.
> - `brandId` uses `SetNull` — deleting a brand simply unlinks the product without removing it.
> - `searchVector` is a native PostgreSQL `tsvector` column for high-performance full-text search (populated via trigger or application logic).
> - `isVeg` is tri-state: `true` (vegetarian), `false` (non-vegetarian), `null` (not applicable — e.g. electronics).

---

### `ProductImage` → `product_images` table

Images associated with a master product. Supports one primary image and multiple gallery images.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `masterProductId` | `master_product_id` | UUID | FK -> `master_products.id`, Cascade, Indexed | The product this image belongs to |
| `objectKey` | `object_key` | VarChar(500) | Required | Object storage key (path in S3 / GCS bucket) |
| `imageType` | `image_type` | `ProductImageType` | Required, Indexed | `PRIMARY` or `GALLERY` |
| `isPrimary` | `is_primary` | Boolean | Default: `false`, Indexed | Whether this is the hero image |
| `displayOrder` | `display_order` | Int | Default: `1`, Indexed | Order within the gallery |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz | Auto-updated | Timestamp |

**Indexes:** `@@index([masterProductId])`, `@@index([imageType])`, `@@index([displayOrder])`, `@@index([isPrimary])`  
**Relations:** `masterProduct -> MasterProduct` (Cascade delete — images are removed when the product is deleted)

> **Design Note:** `objectKey` stores the path in object storage (e.g. `products/abc123/image.webp`) rather than a full URL. The full public URL is constructed at read time by prefixing the CDN base URL.

---

### `StoreProduct` → `store_products` table

A store-specific listing of a master product. A store creates a `StoreProduct` to add a master product to its catalogue with its own pricing and availability settings.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `storeId` | `store_id` | UUID | FK -> `stores.id`, Cascade, Indexed | The store offering this product |
| `masterProductId` | `master_product_id` | UUID | FK -> `master_products.id`, Restrict, Indexed | The underlying master product |
| `mrp` | `mrp` | Decimal(10,2) | Required | Maximum Retail Price |
| `sellingPrice` | `selling_price` | Decimal(10,2) | Required | Store's actual selling price |
| `availabilityStatus` | `availability_status` | `AvailabilityStatus` | Default: `AVAILABLE`, Indexed | Per-store availability state |
| `trackInventory` | `track_inventory` | Boolean | Default: `true` | Whether stock is tracked for this listing |
| `isFeatured` | `is_featured` | Boolean | Default: `false`, Indexed | Feature this product in the store |
| `displayOrder` | `display_order` | Int | Default: `0` | Order in store's product listing |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz? | Optional | Soft-delete timestamp |

**Constraints:** `@@unique([storeId, masterProductId])` — a store can list a master product only once  
**Indexes:** `@@index([storeId])`, `@@index([masterProductId])`, `@@index([availabilityStatus])`, `@@index([isFeatured])`  
**Relations:**
- `store -> Store` (Cascade — deleting a store removes all its product listings)
- `masterProduct -> MasterProduct` (Restrict — cannot delete a master product that is actively listed)
- `inventory -> Inventory?`

> **Design Notes:**
> - The `@@unique([storeId, masterProductId])` constraint prevents duplicate listings of the same product in the same store.
> - `trackInventory = false` allows a store to list a product without managing stock (e.g. made-to-order items).

---

### `Inventory` → `inventory` table

Tracks the real-time stock count for a single `StoreProduct` listing. One-to-one with `StoreProduct`.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `storeProductId` | `store_product_id` | UUID | Unique FK -> `store_products.id`, Cascade | The store product this inventory belongs to |
| `stockQuantity` | `stock_quantity` | Int | Default: `0`, Indexed | Total units currently in stock |
| `reservedQuantity` | `reserved_quantity` | Int | Default: `0` | Units reserved for pending orders |
| `lowStockThreshold` | `low_stock_threshold` | Int | Default: `10` | Alert threshold for low-stock warnings |
| `reorderLevel` | `reorder_level` | Int | Default: `20` | Suggested reorder trigger point |
| `version` | `version` | Int | Default: `0` | Version counter for optimistic locking |
| `lastStockUpdate` | `last_stock_update` | Timestamptz? | Optional | Timestamp of the last stock change |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz | Auto-updated | Timestamp |

**Indexes:** `@@index([stockQuantity])`  
**Relations:**
- `storeProduct -> StoreProduct` (Cascade delete)
- `transactions -> InventoryTransaction[]`

> **Design Notes:**
> - `availableQuantity = stockQuantity - reservedQuantity` (computed at read time, not stored)
> - `version` enables **Optimistic Concurrency Control**: service layer reads current `version`, updates `WHERE id = ... AND version = currentVersion`, and increments `version = version + 1`. This prevents lost updates and overselling under high concurrency.
> - `lowStockThreshold` and `reorderLevel` are store-configurable per product listing.
> - Every change to `stockQuantity` should produce a corresponding `InventoryTransaction` record for auditability.

---

### `InventoryTransaction` → `inventory_transactions` table

An immutable audit log of every stock movement. Each change to inventory (sale, restock, damage, etc.) creates one record. Records are **never updated or deleted**.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `inventoryId` | `inventory_id` | UUID | FK -> `inventory.id`, Cascade, Indexed | The inventory record this movement belongs to |
| `transactionType` | `transaction_type` | `InventoryTransactionType` | Required, Indexed | What kind of movement this is |
| `quantity` | `quantity` | Int | Required | Units added (positive) or removed (negative) |
| `balanceAfterTransaction` | `balance_after_transaction` | Int | Required | `stockQuantity` value after this movement |
| `referenceType` | `reference_type` | `InventoryReferenceType`? | Optional, Indexed | Type of the linked source entity |
| `referenceId` | `reference_id` | UUID? | Optional | ID of the linked source entity |
| `source` | `source` | VarChar(100)? | Optional | Free-text source label (e.g. `admin-panel`, `order-service`) |
| `notes` | `notes` | Text? | Optional | Free-text notes about this movement |
| `createdBy` | `created_by` | UUID? | Optional | Audit: who triggered this transaction |
| `createdAt` | `created_at` | Timestamptz | Auto: `now()`, Indexed | Timestamp |

**Indexes:** `@@index([inventoryId])`, `@@index([transactionType])`, `@@index([referenceType])`, `@@index([createdAt])`

> **Design Notes:**
> - No `updatedAt` or `updatedBy` — transactions are write-once by design.
> - `quantity` is signed: positive = stock added, negative = stock removed.
> - `balanceAfterTransaction` is a denormalized snapshot of the post-transaction balance for fast historical queries without re-summing the ledger.
> - `referenceId` is a generic UUID pointer. The actual entity type is disambiguated by `referenceType`.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    Category {
        uuid id PK
        uuid parentCategoryId FK
        string name
        string slug UK
        bool isActive
        datetime deletedAt
    }
    Brand {
        uuid id PK
        string name
        string slug UK
        bool isActive
        datetime deletedAt
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
        string name
        string slug UK
        string sku UK
        string barcode UK
        decimal gstRate
        decimal unitValue
        bool isVeg
        bool isFeatured
        ProductStatus status
        datetime deletedAt
    }
    ProductImage {
        uuid id PK
        uuid masterProductId FK
        string objectKey
        ProductImageType imageType
        bool isPrimary
        int displayOrder
    }
    Store {
        uuid id PK
        string name
    }
    StoreProduct {
        uuid id PK
        uuid storeId FK
        uuid masterProductId FK
        decimal mrp
        decimal sellingPrice
        AvailabilityStatus availabilityStatus
        bool trackInventory
        datetime deletedAt
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
        InventoryReferenceType referenceType
        uuid referenceId
        datetime createdAt
    }

    Category ||--o{ Category : "has sub-categories"
    Category ||--o{ MasterProduct : "classifies"
    Brand ||--o{ MasterProduct : "brands"
    Unit ||--o{ MasterProduct : "measures"
    MasterProduct ||--o{ ProductImage : "has"
    MasterProduct ||--o{ StoreProduct : "listed as"
    Store ||--o{ StoreProduct : "lists"
    StoreProduct ||--o| Inventory : "tracked by"
    Inventory ||--o{ InventoryTransaction : "has"
```

---

## Catalogue Architecture: Master -> Store Split

The catalogue uses a two-layer model:

```
Platform Layer (shared across all stores)
    |
    |-- Category (hierarchy)
    |-- Brand
    |-- Unit
    +-- MasterProduct <- single source of truth for product data
            |
            +-- ProductImage

Store Layer (per-store overrides)
    |
    +-- StoreProduct <- store listing: price, availability, featured flag
            |
            +-- Inventory <- real-time stock count
                    |
                    +-- InventoryTransaction <- immutable audit ledger
```

This design:
- Eliminates duplicate product data across stores
- Allows stores to set their own pricing (`mrp`, `sellingPrice`)
- Allows the platform to maintain a canonical, searchable product catalogue
- Makes full-text search (`searchVector`) efficient since it operates on `MasterProduct`, not per-store listings

---

## Model Summary

| Model | Table | Records Represent |
|---|---|---|
| `Category` | `categories` | Hierarchical product category tree |
| `Brand` | `brands` | Product brands (platform-wide) |
| `Unit` | `units` | Units of measure (kg, litre, piece) |
| `MasterProduct` | `master_products` | Canonical platform product definitions |
| `ProductImage` | `product_images` | Product images (primary + gallery) |
| `StoreProduct` | `store_products` | Per-store product listings with pricing |
| `Inventory` | `inventory` | Real-time stock per store product |
| `InventoryTransaction` | `inventory_transactions` | Immutable stock movement audit ledger |

---

## Recommended Post-Migration SQL Enhancements

The following PostgreSQL database constraints and indexes are to be applied via raw SQL migration scripts after initial Prisma schema generation:

### 1. Inventory Integrity CHECK Constraints
Prevents invalid negative stock or invalid reservation quantities directly at the database engine layer:
```sql
ALTER TABLE inventory
  ADD CONSTRAINT chk_inventory_stock_non_negative CHECK (stock_quantity >= 0),
  ADD CONSTRAINT chk_inventory_reserved_non_negative CHECK (reserved_quantity >= 0),
  ADD CONSTRAINT chk_inventory_reserved_le_stock CHECK (reserved_quantity <= stock_quantity);
```

### 2. Full-Text Search GIN Index (`master_products`)
Accelerates product catalogue search queries on the native `search_vector` column to prevent full table scans:
```sql
CREATE INDEX idx_master_products_search_vector
ON master_products
USING GIN(search_vector);
```

### 3. Store Product Price CHECK Constraints
Enforces pricing rules directly in the database:
```sql
ALTER TABLE store_products
  ADD CONSTRAINT chk_store_products_selling_price_non_negative CHECK (selling_price >= 0),
  ADD CONSTRAINT chk_store_products_mrp_non_negative CHECK (mrp >= 0),
  ADD CONSTRAINT chk_store_products_selling_price_le_mrp CHECK (selling_price <= mrp);
```


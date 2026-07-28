# Database — Module 2: Store Management

> [← Back to Index](../README.md)  
> **Schema file:** [`server/prisma/modules/module2.store.prisma`](../../server/prisma/modules/module2.store.prisma)  
> **Status:** ✅ Schema Complete (4 models)  
> **Last Updated:** 2026-07-28

---

## Overview

The Store module handles vendor registration and management within the marketplace:
- Store onboarding and profile management
- Store verification & approval workflow
- Store media (logo, banner, gallery images)
- Business identification (GST, registration number)
- GPS-based location for delivery radius
- Operating hours per weekday
- Delivery configuration (radius, charges, pickup toggle)

---

## Enums

> All enums are mapped to snake_case PostgreSQL enum types via `@@map`.

### `StoreStatus` → `store_status`
Tracks the operational state of a store. Managed by the platform admin.

| Value | Description |
|---|---|
| `PENDING` | Store registered but not yet approved |
| `ACTIVE` | Store is live and operational |
| `TEMPORARILY_CLOSED` | Store owner has paused operations |
| `SUSPENDED` | Store suspended by admin (policy violation) |
| `CLOSED` | Store permanently closed |

---

### `VerificationStatus` → `verification_status`
Tracks admin verification of a store's documents/legitimacy.

| Value | Description |
|---|---|
| `PENDING` | Verification request submitted, awaiting review |
| `VERIFIED` | Store documents approved by admin |
| `REJECTED` | Store documents rejected by admin |

---

### `WeekDay` → `week_day`
Days of the week, used for configuring store operating hours.

| Value |
|---|
| `MONDAY` |
| `TUESDAY` |
| `WEDNESDAY` |
| `THURSDAY` |
| `FRIDAY` |
| `SATURDAY` |
| `SUNDAY` |

---

## Store Availability & Checkout Rules

Store availability is evaluated using three independent layers of responsibility:

| State Field | Scope & Responsibility | Controlled By |
|---|---|---|
| `Store.status` | **Platform / Admin Lifecycle** — Controls whether the store is approved and live. | Platform Admin |
| `Store.isOpen` | **Manual Merchant Override** — Real-time toggle to temporarily pause orders (e.g. rush hours, kitchen break). | Merchant |
| `StoreHour` | **Scheduled Business Hours** — Weekly schedule defining opening/closing times per weekday. | Merchant |

### Single Source of Truth — Checkout Evaluation Rule

For a customer to place an order, **all three** conditions must be satisfied simultaneously:

```
CanCheckout = (Store.status == ACTIVE)
           AND (Store.isOpen == true)
           AND (CurrentTime is within today's StoreHour window)
```

```typescript
function isStoreAcceptingOrders(store: Store, storeHours: StoreHour[], now: Date = new Date()): boolean {
  if (store.status !== StoreStatus.ACTIVE) return false;
  if (!store.isOpen) return false;

  const currentDay = getWeekDayEnum(now);
  const todayHours = storeHours.find((h) => h.weekDay === currentDay);

  if (!todayHours || todayHours.isClosed) return false;
  if (!todayHours.openingTime || !todayHours.closingTime) return false;

  const currentTimeStr = formatTime(now); // "HH:mm:ss"
  return currentTimeStr >= todayHours.openingTime && currentTimeStr <= todayHours.closingTime;
}
```

---

## Models

> All models map to snake_case PostgreSQL table names via `@@map`. All camelCase fields map to snake_case column names via `@map`.

### `Store` → `stores` table

Core store record. Each user can own at most one store (`ownerId` is unique).

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `ownerId` | `owner_id` | UUID | Unique FK → `users.id`, Restrict | Store owner (one store per user) |
| `name` | `name` | VarChar(150) | Required | Display name of the store |
| `slug` | `slug` | VarChar(180) | Unique | URL-friendly identifier |
| `description` | `description` | Text? | Optional | Store description |
| `phone` | `phone` | VarChar(15) | Unique | Store contact phone |
| `email` | `email` | VarChar(255)? | Unique | Store contact email |
| `gstNumber` | `gst_number` | VarChar(20)? | Unique | GST registration number |
| `businessRegistrationNumber` | `business_registration_number` | VarChar(50)? | Unique | Business registration number |
| `logoKey` | `logo_key` | VarChar(500)? | Optional | Object storage key for store logo |
| `bannerKey` | `banner_key` | VarChar(500)? | Optional | Object storage key for store banner |
| `addressLine1` | `address_line1` | VarChar(255) | Required | Primary address line |
| `addressLine2` | `address_line2` | VarChar(255)? | Optional | Secondary address line |
| `city` | `city` | VarChar(100) | Required, Indexed | City |
| `state` | `state` | VarChar(100) | Required, Indexed | State |
| `country` | `country` | VarChar(100) | Required | Country |
| `pincode` | `pincode` | VarChar(20) | Required, Indexed | Postal code |
| `latitude` | `latitude` | Decimal(9,6) | Required, Indexed | GPS latitude |
| `longitude` | `longitude` | Decimal(9,6) | Required, Indexed | GPS longitude |
| `timezone` | `timezone` | VarChar(100) | Default: `Asia/Kolkata` | Store's local timezone |
| `status` | `status` | `StoreStatus` | Default: `PENDING`, Indexed | Platform operational status |
| `verificationStatus` | `verification_status` | `VerificationStatus` | Default: `PENDING`, Indexed | Document verification status |
| `verifiedAt` | `verified_at` | Timestamptz(6)? | Optional | When verification was approved |
| `verifiedById` | `verified_by_id` | UUID? | FK → `users.id`, SetNull, Indexed | Admin who verified the store |
| `isOpen` | `is_open` | Boolean | Default: `false`, Indexed | Real-time merchant open/closed toggle |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |
| `deletedAt` | `deleted_at` | Timestamptz(6)? | Optional | Soft-delete timestamp |

**Indexes:** `@@index([status])`, `@@index([verificationStatus])`, `@@index([city])`, `@@index([state])`, `@@index([pincode])`, `@@index([latitude, longitude])`, `@@index([ownerId])`, `@@index([verifiedById])`, `@@index([isOpen])`

**Relations:**
- `owner → User` (via `StoreOwner` named relation)
- `verifiedBy → User?` (via `StoreVerifier` named relation)
- `images → StoreImage[]`
- `hours → StoreHour[]`
- `deliverySetting → StoreDeliverySetting?`
- `carts → Cart[]`
- `orders → Order[]`
- `storeProducts → StoreProduct[]`

> **Design Notes:**
> - `ownerId` is `@unique` — enforces one store per user
> - `logoKey`, `bannerKey` store object-storage keys — CDN base URL is prepended in the API layer
> - `averageRating` and `totalReviews` have been removed pending a dedicated Review module
> - `verifiedBy` uses `SetNull` so deleting an admin user doesn't break store records

---

### `StoreImage` → `store_images` table

Gallery images for a store (beyond the logo and banner stored on the `Store` model itself).

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `storeId` | `store_id` | UUID | FK → `stores.id`, Cascade, Indexed | The store this image belongs to |
| `objectKey` | `object_key` | VarChar(500) | Required | Object storage key for the gallery image |
| `displayOrder` | `display_order` | Int | Default: `1` | Controls ordering in the gallery |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |

**Indexes:** `@@index([storeId])`, `@@index([storeId, displayOrder])`

---

### `StoreHour` → `store_hours` table

Defines the operating hours for each day of the week for a store.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `storeId` | `store_id` | UUID | FK → `stores.id`, Cascade, Indexed | The store these hours belong to |
| `weekDay` | `week_day` | `WeekDay` | Required, Indexed | Day of the week |
| `openingTime` | `opening_time` | Time(6)? | Optional | Opening time (null if closed all day) |
| `closingTime` | `closing_time` | Time(6)? | Optional | Closing time (null if closed all day) |
| `isClosed` | `is_closed` | Boolean | Default: `false` | Mark store as closed this day |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |

**Constraints:** `@@unique([storeId, weekDay])` — one record per day per store  
**Indexes:** `@@index([storeId])`, `@@index([weekDay])`

> **Design Note:** `openingTime` and `closingTime` are nullable — setting `isClosed = true` without needing to clear times is valid. Exactly 7 rows should exist per store (one per weekday), created atomically with the store.

---

### `StoreDeliverySetting` → `store_delivery_settings` table

Stores all delivery configuration for a store. One-to-one relationship with `Store`.

| Field | DB Column | Type | Constraint | Description |
|---|---|---|---|---|
| `id` | `id` | UUID | PK, auto | Primary key |
| `storeId` | `store_id` | UUID | Unique FK → `stores.id`, Cascade | The store (one delivery config per store) |
| `isDeliveryAvailable` | `is_delivery_available` | Boolean | Default: `true` | Whether home delivery is offered |
| `isPickupAvailable` | `is_pickup_available` | Boolean | Default: `true` | Whether in-store pickup is offered |
| `minimumOrderAmount` | `minimum_order_amount` | Decimal(10,2) | Default: `0.00` | Minimum cart value to place an order |
| `deliveryRadiusKm` | `delivery_radius_km` | Decimal(5,2) | Default: `5.00` | Max delivery radius in kilometres |
| `deliveryCharge` | `delivery_charge` | Decimal(10,2) | Default: `0.00` | Flat delivery fee charged to customer |
| `freeDeliveryAbove` | `free_delivery_above` | Decimal(10,2)? | Optional | Cart threshold for free delivery (`null` = never free) |
| `estimatedDeliveryTime` | `estimated_delivery_time` | Int | Default: `30` | Estimated delivery time in minutes |
| `createdBy` | `created_by` | UUID? | Optional | Audit trail |
| `updatedBy` | `updated_by` | UUID? | Optional | Audit trail |
| `createdAt` | `created_at` | Timestamptz(6) | Auto: `now()` | Timestamp |
| `updatedAt` | `updated_at` | Timestamptz(6) | Auto-updated | Timestamp |

**Indexes:** `@@index` on `store_id` via unique constraint

> **Mandatory Creation Contract (Service Layer):** Although `deliverySetting` is optional in Prisma's schema, **every store creation MUST initialize a default `StoreDeliverySetting` within the same database transaction:**
>
> ```typescript
> await prisma.store.create({
>   data: {
>     ...storeData,
>     deliverySetting: {
>       create: {
>         isDeliveryAvailable: true,
>         isPickupAvailable: true,
>         minimumOrderAmount: 0.00,
>         deliveryRadiusKm: 5.00,
>         deliveryCharge: 0.00,
>         estimatedDeliveryTime: 30,
>       },
>     },
>   },
> });
> ```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    User {
        uuid id PK
        string phone UK
    }
    Store {
        uuid id PK
        uuid ownerId FK_UK
        uuid verifiedById FK
        string name
        string slug UK
        string phone UK
        string gstNumber UK
        StoreStatus status
        VerificationStatus verificationStatus
        bool isOpen
        datetime deletedAt
    }
    StoreImage {
        uuid id PK
        uuid storeId FK
        string objectKey
        int displayOrder
    }
    StoreHour {
        uuid id PK
        uuid storeId FK
        WeekDay weekDay
        time openingTime
        time closingTime
        bool isClosed
    }
    StoreDeliverySetting {
        uuid id PK
        uuid storeId FK_UK
        bool isDeliveryAvailable
        bool isPickupAvailable
        decimal minimumOrderAmount
        decimal deliveryRadiusKm
        decimal deliveryCharge
        decimal freeDeliveryAbove
        int estimatedDeliveryTime
    }

    User ||--o| Store : "owns"
    User ||--o{ Store : "verifies"
    Store ||--o{ StoreImage : "has"
    Store ||--o{ StoreHour : "has (7 rows)"
    Store ||--|| StoreDeliverySetting : "has"
```

---

## Model Summary

| Model | Table | Status |
|---|---|---|
| `Store` | `stores` | ✅ Documented |
| `StoreImage` | `store_images` | ✅ Documented |
| `StoreHour` | `store_hours` | ✅ Documented |
| `StoreDeliverySetting` | `store_delivery_settings` | ✅ Documented |

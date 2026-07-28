# Data Dictionary — aasPass Platform

> **Document Type:** Data Dictionary  
> **Version:** v0.1 (Draft)  
> **Status:** 🟡 Draft  
> **Date:** 2026-07-28  
> **Author:** Engineering Team  

---

## Version History

| Version | Date | Status | Summary |
|---|---|---|---|
| v0.1 | 2026-07-28 | Draft | Initial data dictionary — all 6 modules, 27 enums, 30 tables |

---

## Reading This Document

| Symbol | Meaning |
|---|---|
| 🔑 | Primary Key |
| 🔗 | Foreign Key |
| 🔒 | Unique constraint |
| ★ | Indexed column |
| ✳ | Composite index |

**Column Attribute Abbreviations:**

| Abbreviation | Meaning |
|---|---|
| PK | Primary Key |
| FK | Foreign Key |
| UQ | Unique |
| NN | Not Null |
| DEF | Has default value |
| IDX | Indexed |

---

## Enums (PostgreSQL Custom Types)

All enums are mapped to snake_case PostgreSQL enum types.

### Module 1 — IAM

| Enum (Prisma) | DB Type | Values |
|---|---|---|
| `UserStatus` | `user_status` | `ACTIVE`, `INACTIVE`, `BLOCKED`, `PENDING_VERIFICATION` |
| `OTPPurpose` | `otp_purpose` | `ORDER_DELIVERY`, `ORDER_PICKUP`, `ACCOUNT_RECOVERY`, `SENSITIVE_ACTION` |
| `OTPChannel` | `otp_channel` | `SMS`, `EMAIL` |
| `BusinessOTPReferenceType` | `business_otp_reference_type` | `ORDER`, `ACCOUNT` |
| `DeviceType` | `device_type` | `MOBILE`, `TABLET`, `DESKTOP`, `WEB` |
| `RevocationReason` | `revocation_reason` | `LOGOUT`, `PASSWORD_CHANGED`, `TOKEN_ROTATED`, `ACCOUNT_LOCKED`, `SECURITY`, `EXPIRED` |

### Module 2 — Store

| Enum (Prisma) | DB Type | Values |
|---|---|---|
| `StoreStatus` | `store_status` | `PENDING`, `ACTIVE`, `TEMPORARILY_CLOSED`, `SUSPENDED`, `CLOSED` |
| `VerificationStatus` | `verification_status` | `PENDING`, `VERIFIED`, `REJECTED` |
| `WeekDay` | `week_day` | `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY` |

### Module 3 — Catalog & Inventory

| Enum (Prisma) | DB Type | Values |
|---|---|---|
| `ProductStatus` | `product_status` | `ACTIVE`, `INACTIVE`, `DISCONTINUED` |
| `ProductImageType` | `product_image_type` | `PRIMARY`, `GALLERY` |
| `AvailabilityStatus` | `availability_status` | `AVAILABLE`, `OUT_OF_STOCK`, `HIDDEN`, `DISCONTINUED` |
| `InventoryTransactionType` | `inventory_transaction_type` | `PURCHASE`, `SALE`, `RETURN`, `RESTOCK`, `ADJUSTMENT`, `DAMAGE`, `EXPIRED` |
| `InventoryReferenceType` | `inventory_reference_type` | `ORDER`, `PURCHASE`, `RETURN`, `MANUAL` |

### Module 4 — Cart & Wishlist

| Enum (Prisma) | DB Type | Values |
|---|---|---|
| `CartStatus` | `cart_status` | `ACTIVE`, `CHECKED_OUT`, `ABANDONED`, `EXPIRED` |

### Module 5 — Order Management

| Enum (Prisma) | DB Type | Values |
|---|---|---|
| `OrderStatus` | `order_status` | `PENDING`, `CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `FAILED` |
| `FulfillmentType` | `fulfillment_type` | `DELIVERY`, `PICKUP` |
| `FulfillmentStatus` | `fulfillment_status` | `PENDING`, `CONFIRMED`, `REPLACED`, `CANCELLED`, `DELIVERED` |
| `ReplacementStatus` | `replacement_status` | `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` |
| `OrderNoteType` | `order_note_type` | `CUSTOMER`, `MERCHANT`, `SYSTEM`, `DELIVERY_PARTNER` |

### Module 6 — Payment & Financial

| Enum (Prisma) | DB Type | Values |
|---|---|---|
| `PaymentMethod` | `payment_method` | `COD`, `UPI`, `CARD`, `NET_BANKING`, `WALLET` |
| `PaymentStatus` | `payment_status` | `PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `CANCELLED`, `PARTIALLY_REFUNDED`, `REFUNDED` |
| `PaymentGateway` | `payment_gateway` | `RAZORPAY`, `CASH` |
| `PaymentTransactionStatus` | `payment_transaction_status` | `INITIATED`, `SUCCESS`, `FAILED`, `CANCELLED` |
| `RefundStatus` | `refund_status` | `PENDING`, `PROCESSED`, `FAILED` |
| `FinancialDocumentType` | `financial_document_type` | `INVOICE`, `RECEIPT`, `CREDIT_NOTE` |

---

## Module 1 — Identity & Access Management (IAM)

### Table: `roles`

Prisma Model: `Role`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique role identifier |
| `code` | `varchar(50)` | UQ, NN | — | Machine-readable role code (e.g. `ADMIN`) |
| `name` | `varchar(100)` | UQ, NN | — | Human-readable role name |
| `description` | `varchar(255)` | — | `NULL` | Optional description |
| `is_system` | `boolean` | NN | `false` | System roles cannot be deleted |
| `is_active` | `boolean` | NN | `true` | Soft-disable without deletion |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `roles_pkey` | `id` | UNIQUE | Primary key |
| `roles_code_key` | `code` | UNIQUE | — |
| `roles_name_key` | `name` | UNIQUE | — |
| `roles_is_active_idx` | `is_active` | BTREE | Filter active roles |

---

### Table: `permissions`

Prisma Model: `Permission`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique permission identifier |
| `code` | `varchar(100)` | UQ, NN | — | Machine-readable permission code (e.g. `catalog:product:create`) |
| `name` | `varchar(100)` | UQ, NN | — | Human-readable permission name |
| `module` | `varchar(100)` | NN | — | Owning module (e.g. `catalog`, `order`) |
| `description` | `varchar(255)` | — | `NULL` | Optional description |
| `is_system` | `boolean` | NN | `false` | System permissions cannot be deleted |
| `is_active` | `boolean` | NN | `true` | Soft-disable without deletion |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `permissions_pkey` | `id` | UNIQUE | Primary key |
| `permissions_code_key` | `code` | UNIQUE | — |
| `permissions_name_key` | `name` | UNIQUE | — |
| `permissions_module_idx` | `module` | BTREE | Filter by module |
| `permissions_is_active_idx` | `is_active` | BTREE | Filter active permissions |

---

### Table: `role_permissions`

Prisma Model: `RolePermission`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique row identifier |
| `role_id` 🔗 | `uuid` | FK → `roles.id`, NN | — | Role reference (CASCADE DELETE) |
| `permission_id` 🔗 | `uuid` | FK → `permissions.id`, NN | — | Permission reference (CASCADE DELETE) |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NN | auto | Last update timestamp |

**Constraints:**

| Constraint | Columns | Notes |
|---|---|---|
| `role_permissions_role_id_permission_id_key` | `role_id, permission_id` | Prevents duplicate assignments |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `role_permissions_pkey` | `id` | UNIQUE | Primary key |
| `role_permissions_role_id_permission_id_key` | `role_id, permission_id` | UNIQUE | Composite unique |
| `role_permissions_role_id_idx` | `role_id` | BTREE | FK lookup |
| `role_permissions_permission_id_idx` | `permission_id` | BTREE | FK lookup |

---

### Table: `users`

Prisma Model: `User`

> **Note:** `id` is **NOT** auto-generated. It is set from Supabase Auth's user UUID at registration.

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | — | Supabase Auth user UUID (no auto-generate) |
| `role_id` 🔗 | `uuid` | FK → `roles.id`, NN | — | Assigned role (RESTRICT DELETE) |
| `first_name` | `varchar(100)` | NN | — | First name |
| `last_name` | `varchar(100)` | — | `NULL` | Last name (optional) |
| `phone` | `varchar(15)` | UQ | `NULL` | Mobile phone number |
| `email` | `varchar(255)` | UQ | `NULL` | Email address |
| `status` | `user_status` | NN | `PENDING_VERIFICATION` | Account lifecycle status |
| `email_verified_at` | `timestamptz` | — | `NULL` | When email was verified (synced from Supabase) |
| `phone_verified_at` | `timestamptz` | — | `NULL` | When phone was verified (synced from Supabase) |
| `last_seen_at` | `timestamptz` | — | `NULL` | Last activity timestamp |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz` | — | `NULL` | Soft-delete timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `users_pkey` | `id` | UNIQUE | Primary key |
| `users_phone_key` | `phone` | UNIQUE | — |
| `users_email_key` | `email` | UNIQUE | — |
| `users_role_id_idx` | `role_id` | BTREE | FK lookup |
| `users_status_idx` | `status` | BTREE | Filter by status |
| `users_phone_idx` | `phone` | BTREE | Lookup by phone |
| `users_email_idx` | `email` | BTREE | Lookup by email |

---

### Table: `addresses`

Prisma Model: `Address`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique address identifier |
| `user_id` 🔗 | `uuid` | FK → `users.id`, NN | — | Owning user (CASCADE DELETE) |
| `label` | `varchar(50)` | — | `NULL` | User label (e.g. "Home", "Office") |
| `receiver_name` | `varchar(100)` | NN | — | Name of the delivery receiver |
| `receiver_phone` | `varchar(15)` | NN | — | Phone of the delivery receiver |
| `house_no` | `varchar(100)` | NN | — | House/flat/door number |
| `street` | `varchar(255)` | — | `NULL` | Street name (optional) |
| `area` | `varchar(255)` | NN | — | Area/locality/colony |
| `landmark` | `varchar(255)` | — | `NULL` | Nearby landmark (optional) |
| `city` | `varchar(100)` | NN | — | City name |
| `state` | `varchar(100)` | NN | — | State name |
| `country` | `varchar(100)` | NN | — | Country name |
| `pincode` | `varchar(10)` | NN | — | Postal/ZIP code |
| `latitude` | `decimal(10,8)` | — | `NULL` | GPS latitude |
| `longitude` | `decimal(11,8)` | — | `NULL` | GPS longitude |
| `is_default` | `boolean` | NN | `false` | Whether this is the user's default address |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz` | — | `NULL` | Soft-delete timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `addresses_pkey` | `id` | UNIQUE | Primary key |
| `addresses_user_id_idx` | `user_id` | BTREE | FK lookup |
| `addresses_user_id_is_default_idx` | `user_id, is_default` | BTREE | Find default address for user |
| `addresses_city_idx` | `city` | BTREE | Filter by city |
| `addresses_pincode_idx` | `pincode` | BTREE | Filter by pincode |

---

### Table: `business_otps`

Prisma Model: `BusinessOTP`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique OTP record identifier |
| `user_id` 🔗 | `uuid` | FK → `users.id` | `NULL` | Associated user (nullable for pre-auth OTPs; CASCADE DELETE) |
| `reference_type` | `business_otp_reference_type` | — | `NULL` | Polymorphic entity type (`ORDER`, `ACCOUNT`) |
| `reference_id` | `uuid` | — | `NULL` | Polymorphic entity ID |
| `purpose` | `otp_purpose` | NN | — | Why OTP was generated |
| `channel` | `otp_channel` | NN | — | Delivery channel (SMS or EMAIL) |
| `destination` | `varchar(255)` | NN | — | Phone number or email address |
| `otp_hash` | `varchar(255)` | NN | — | Bcrypt hash of the OTP (never stored plaintext) |
| `attempts` | `integer` | NN | `0` | Number of verification attempts |
| `max_attempts` | `integer` | NN | `5` | Maximum allowed attempts before block |
| `last_attempt_at` | `timestamptz` | — | `NULL` | Timestamp of last attempt |
| `blocked_until` | `timestamptz` | — | `NULL` | Brute-force block expiry |
| `expires_at` | `timestamptz` | NN | — | OTP expiry timestamp |
| `verified_at` | `timestamptz` | — | `NULL` | When OTP was successfully verified |
| `consumed_at` | `timestamptz` | — | `NULL` | When OTP was consumed (action completed) |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `business_otps_pkey` | `id` | UNIQUE | Primary key |
| `business_otps_user_id_idx` | `user_id` | BTREE | Lookup by user |
| `business_otps_reference_type_reference_id_idx` | `reference_type, reference_id` | BTREE | Polymorphic lookup |
| `business_otps_purpose_idx` | `purpose` | BTREE | Filter by purpose |
| `business_otps_channel_idx` | `channel` | BTREE | Filter by channel |
| `business_otps_destination_idx` | `destination` | BTREE | Lookup by phone/email |
| `business_otps_expires_at_idx` | `expires_at` | BTREE | TTL cleanup queries |

---

### Table: `user_sessions`

Prisma Model: `UserSession`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique session identifier |
| `user_id` 🔗 | `uuid` | FK → `users.id`, NN | — | Session owner (CASCADE DELETE) |
| `device_type` | `device_type` | NN | — | Type of client device |
| `device_name` | `varchar(255)` | — | `NULL` | Friendly device name |
| `device_id` | `varchar(255)` | — | `NULL` | Device fingerprint identifier |
| `ip_address` | `varchar(45)` | — | `NULL` | Client IP (IPv4 or IPv6) |
| `user_agent` | `text` | — | `NULL` | Raw user-agent string |
| `last_activity_at` | `timestamptz` | NN | `now()` | Last request timestamp |
| `revoked_at` | `timestamptz` | — | `NULL` | When session was revoked |
| `revocation_reason` | `revocation_reason` | — | `NULL` | Why session was revoked |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz` | NN | `now()` | Session creation timestamp |
| `updated_at` | `timestamptz` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `user_sessions_pkey` | `id` | UNIQUE | Primary key |
| `user_sessions_user_id_idx` | `user_id` | BTREE | Lookup all sessions for user |
| `user_sessions_user_id_device_id_idx` | `user_id, device_id` | BTREE | Find session for a specific device |
| `user_sessions_last_activity_at_idx` | `last_activity_at` | BTREE | Expire inactive sessions |
| `user_sessions_revoked_at_idx` | `revoked_at` | BTREE | Filter active sessions |

---

## Module 2 — Store Management

### Table: `stores`

Prisma Model: `Store`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique store identifier |
| `owner_id` 🔗 | `uuid` | FK → `users.id`, UQ, NN | — | Store owner — one per user (RESTRICT DELETE) |
| `name` | `varchar(150)` | NN | — | Store display name |
| `slug` | `varchar(180)` | UQ, NN | — | URL-safe store identifier |
| `description` | `text` | — | `NULL` | Store description |
| `phone` | `varchar(15)` | UQ, NN | — | Store contact phone |
| `email` | `varchar(255)` | UQ | `NULL` | Store contact email |
| `gst_number` | `varchar(20)` | UQ | `NULL` | GST registration number |
| `business_registration_number` | `varchar(50)` | UQ | `NULL` | Business registration ID |
| `logo_key` | `varchar(500)` | — | `NULL` | Object storage key for logo image |
| `banner_key` | `varchar(500)` | — | `NULL` | Object storage key for banner image |
| `address_line1` | `varchar(255)` | NN | — | Primary address line |
| `address_line2` | `varchar(255)` | — | `NULL` | Secondary address line |
| `city` | `varchar(100)` | NN | — | City name |
| `state` | `varchar(100)` | NN | — | State name |
| `country` | `varchar(100)` | NN | — | Country name |
| `pincode` | `varchar(20)` | NN | — | Postal code |
| `latitude` | `decimal(9,6)` | NN | — | GPS latitude |
| `longitude` | `decimal(9,6)` | NN | — | GPS longitude |
| `timezone` | `varchar(100)` | NN | `Asia/Kolkata` | Store timezone |
| `status` | `store_status` | NN | `PENDING` | Platform operational status |
| `verification_status` | `verification_status` | NN | `PENDING` | Document verification status |
| `verified_at` | `timestamptz(6)` | — | `NULL` | When the store was verified |
| `verified_by_id` 🔗 | `uuid` | FK → `users.id` | `NULL` | Admin who verified the store (SET NULL) |
| `is_open` | `boolean` | NN | `false` | Real-time merchant toggle (pause orders) |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz(6)` | — | `NULL` | Soft-delete timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `stores_pkey` | `id` | UNIQUE | Primary key |
| `stores_owner_id_key` | `owner_id` | UNIQUE | One store per user |
| `stores_slug_key` | `slug` | UNIQUE | — |
| `stores_phone_key` | `phone` | UNIQUE | — |
| `stores_email_key` | `email` | UNIQUE | — |
| `stores_gst_number_key` | `gst_number` | UNIQUE | — |
| `stores_business_registration_number_key` | `business_registration_number` | UNIQUE | — |
| `stores_status_idx` | `status` | BTREE | Filter by operational status |
| `stores_verification_status_idx` | `verification_status` | BTREE | Filter by verification status |
| `stores_city_idx` | `city` | BTREE | Search by city |
| `stores_state_idx` | `state` | BTREE | Search by state |
| `stores_pincode_idx` | `pincode` | BTREE | Search by pincode |
| `stores_latitude_longitude_idx` | `latitude, longitude` | BTREE | Geospatial proximity queries |
| `stores_owner_id_idx` | `owner_id` | BTREE | FK lookup |
| `stores_verified_by_id_idx` | `verified_by_id` | BTREE | FK lookup |
| `stores_is_open_idx` | `is_open` | BTREE | Filter open stores |

---

### Table: `store_images`

Prisma Model: `StoreImage`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique image record |
| `store_id` 🔗 | `uuid` | FK → `stores.id`, NN | — | Owner store (CASCADE DELETE) |
| `object_key` | `varchar(500)` | NN | — | Object storage key for the image |
| `display_order` | `integer` | NN | `1` | Display sequence order |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `store_images_pkey` | `id` | UNIQUE | Primary key |
| `store_images_store_id_idx` | `store_id` | BTREE | FK lookup |
| `store_images_store_id_display_order_idx` | `store_id, display_order` | BTREE | Ordered gallery retrieval |

---

### Table: `store_hours`

Prisma Model: `StoreHour`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique store hour record |
| `store_id` 🔗 | `uuid` | FK → `stores.id`, NN | — | Owner store (CASCADE DELETE) |
| `week_day` | `week_day` | NN | — | Day of week |
| `opening_time` | `time(6)` | — | `NULL` | Opening time (null if closed all day) |
| `closing_time` | `time(6)` | — | `NULL` | Closing time (null if closed all day) |
| `is_closed` | `boolean` | NN | `false` | Whether store is closed this day |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

**Constraints:**

| Constraint | Columns | Notes |
|---|---|---|
| `store_hours_store_id_week_day_key` | `store_id, week_day` | One record per store per day |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `store_hours_pkey` | `id` | UNIQUE | Primary key |
| `store_hours_store_id_week_day_key` | `store_id, week_day` | UNIQUE | Composite unique |
| `store_hours_store_id_idx` | `store_id` | BTREE | FK lookup |
| `store_hours_week_day_idx` | `week_day` | BTREE | Filter by day |

---

### Table: `store_delivery_settings`

Prisma Model: `StoreDeliverySetting`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique settings record |
| `store_id` 🔗 | `uuid` | FK → `stores.id`, UQ, NN | — | Owner store — one-to-one (CASCADE DELETE) |
| `is_delivery_available` | `boolean` | NN | `true` | Whether home delivery is offered |
| `is_pickup_available` | `boolean` | NN | `true` | Whether customer pickup is offered |
| `minimum_order_amount` | `decimal(10,2)` | NN | `0.00` | Minimum cart value for delivery |
| `delivery_radius_km` | `decimal(5,2)` | NN | `5.00` | Maximum delivery radius in kilometers |
| `delivery_charge` | `decimal(10,2)` | NN | `0.00` | Fixed delivery fee |
| `free_delivery_above` | `decimal(10,2)` | — | `NULL` | Cart threshold for free delivery |
| `estimated_delivery_time` | `integer` | NN | `30` | Estimated delivery time in minutes |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `store_delivery_settings_pkey` | `id` | UNIQUE | Primary key |
| `store_delivery_settings_store_id_key` | `store_id` | UNIQUE | One per store |

---

## Module 3 — Catalog & Inventory

### Table: `categories`

Prisma Model: `Category`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique category identifier |
| `parent_category_id` 🔗 | `uuid` | FK → `categories.id` | `NULL` | Parent category (SET NULL on parent delete) |
| `name` | `varchar(150)` | NN | — | Category display name |
| `slug` | `varchar(170)` | UQ, NN | — | URL-safe category identifier |
| `description` | `text` | — | `NULL` | Category description |
| `image_key` | `varchar(500)` | — | `NULL` | Object storage key for category image |
| `icon_key` | `varchar(500)` | — | `NULL` | Object storage key for category icon |
| `sort_order` | `integer` | NN | `0` | Display order in category listings |
| `is_active` | `boolean` | NN | `true` | Soft-disable |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz(6)` | — | `NULL` | Soft-delete timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `categories_pkey` | `id` | UNIQUE | Primary key |
| `categories_slug_key` | `slug` | UNIQUE | — |
| `categories_parent_category_id_idx` | `parent_category_id` | BTREE | Tree traversal |
| `categories_slug_idx` | `slug` | BTREE | URL lookup |
| `categories_is_active_idx` | `is_active` | BTREE | Filter active categories |
| `categories_sort_order_idx` | `sort_order` | BTREE | Ordered listing |

---

### Table: `brands`

Prisma Model: `Brand`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique brand identifier |
| `name` | `varchar(150)` | NN | — | Brand display name |
| `slug` | `varchar(170)` | UQ, NN | — | URL-safe brand identifier |
| `logo_key` | `varchar(500)` | — | `NULL` | Object storage key for brand logo |
| `is_active` | `boolean` | NN | `true` | Soft-disable |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz(6)` | — | `NULL` | Soft-delete timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `brands_pkey` | `id` | UNIQUE | Primary key |
| `brands_slug_key` | `slug` | UNIQUE | — |
| `brands_slug_idx` | `slug` | BTREE | URL lookup |
| `brands_is_active_idx` | `is_active` | BTREE | Filter active brands |

---

### Table: `units`

Prisma Model: `Unit`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique unit identifier |
| `name` | `varchar(100)` | UQ, NN | — | Full unit name (e.g. "Kilogram") |
| `symbol` | `varchar(20)` | UQ, NN | — | Short symbol (e.g. "kg") |
| `description` | `text` | — | `NULL` | Optional description |
| `is_active` | `boolean` | NN | `true` | Soft-disable |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz(6)` | — | `NULL` | Soft-delete timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `units_pkey` | `id` | UNIQUE | Primary key |
| `units_name_key` | `name` | UNIQUE | — |
| `units_symbol_key` | `symbol` | UNIQUE | — |
| `units_is_active_idx` | `is_active` | BTREE | Filter active units |

---

### Table: `master_products`

Prisma Model: `MasterProduct`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique product identifier |
| `category_id` 🔗 | `uuid` | FK → `categories.id`, NN | — | Product category (RESTRICT DELETE) |
| `brand_id` 🔗 | `uuid` | FK → `brands.id` | `NULL` | Product brand (SET NULL on delete) |
| `unit_id` 🔗 | `uuid` | FK → `units.id`, NN | — | Measurement unit (RESTRICT DELETE) |
| `name` | `varchar(200)` | NN | — | Product name |
| `slug` | `varchar(220)` | UQ, NN | — | URL-safe product identifier |
| `description` | `text` | — | `NULL` | Product description |
| `sku` | `varchar(100)` | UQ, NN | — | Stock Keeping Unit code |
| `barcode` | `varchar(100)` | UQ | `NULL` | EAN/UPC barcode |
| `hsn_code` | `varchar(20)` | — | `NULL` | HSN code for GST classification |
| `gst_rate` | `decimal(5,2)` | NN | `0.00` | GST rate percentage |
| `unit_value` | `decimal(10,2)` | NN | — | Quantity per unit (e.g. 500 for 500g) |
| `is_veg` | `boolean` | — | `NULL` | Vegetarian indicator (null = not applicable) |
| `is_featured` | `boolean` | NN | `false` | Pinned to featured listings |
| `status` | `product_status` | NN | `ACTIVE` | Product lifecycle status |
| `search_vector` | `tsvector` | — | `NULL` | PostgreSQL full-text search vector |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz(6)` | — | `NULL` | Soft-delete timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `master_products_pkey` | `id` | UNIQUE | Primary key |
| `master_products_slug_key` | `slug` | UNIQUE | — |
| `master_products_sku_key` | `sku` | UNIQUE | — |
| `master_products_barcode_key` | `barcode` | UNIQUE | — |
| `master_products_category_id_idx` | `category_id` | BTREE | FK lookup |
| `master_products_brand_id_idx` | `brand_id` | BTREE | FK lookup |
| `master_products_unit_id_idx` | `unit_id` | BTREE | FK lookup |
| `master_products_status_idx` | `status` | BTREE | Filter by status |
| `master_products_is_featured_idx` | `is_featured` | BTREE | Featured products |
| `master_products_slug_idx` | `slug` | BTREE | URL lookup |
| `master_products_sku_idx` | `sku` | BTREE | SKU lookup |
| `master_products_barcode_idx` | `barcode` | BTREE | Barcode scan lookup |
| *(planned)* `master_products_search_vector_gin` | `search_vector` | GIN | Full-text search |

---

### Table: `product_images`

Prisma Model: `ProductImage`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique image record |
| `master_product_id` 🔗 | `uuid` | FK → `master_products.id`, NN | — | Owner product (CASCADE DELETE) |
| `object_key` | `varchar(500)` | NN | — | Object storage key |
| `image_type` | `product_image_type` | NN | — | `PRIMARY` or `GALLERY` |
| `is_primary` | `boolean` | NN | `false` | Whether this is the primary display image |
| `display_order` | `integer` | NN | `1` | Gallery display sequence |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `product_images_pkey` | `id` | UNIQUE | Primary key |
| `product_images_master_product_id_idx` | `master_product_id` | BTREE | FK lookup |
| `product_images_master_product_id_display_order_idx` | `master_product_id, display_order` | BTREE | Ordered gallery |
| `product_images_master_product_id_is_primary_idx` | `master_product_id, is_primary` | BTREE | Find primary image |

---

### Table: `store_products`

Prisma Model: `StoreProduct`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique store product listing |
| `store_id` 🔗 | `uuid` | FK → `stores.id`, NN | — | Owner store (CASCADE DELETE) |
| `master_product_id` 🔗 | `uuid` | FK → `master_products.id`, NN | — | Reference product (RESTRICT DELETE) |
| `mrp` | `decimal(10,2)` | NN | — | Maximum Retail Price |
| `selling_price` | `decimal(10,2)` | NN | — | Actual selling price |
| `availability_status` | `availability_status` | NN | `AVAILABLE` | Stock/availability status |
| `track_inventory` | `boolean` | NN | `true` | Whether to track inventory (false for made-to-order) |
| `is_featured` | `boolean` | NN | `false` | Pinned in store's featured section |
| `display_order` | `integer` | NN | `0` | Display ordering within the store |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz(6)` | — | `NULL` | Soft-delete timestamp |

**Constraints:**

| Constraint | Columns | Notes |
|---|---|---|
| `store_products_store_id_master_product_id_key` | `store_id, master_product_id` | Each product listed once per store |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `store_products_pkey` | `id` | UNIQUE | Primary key |
| `store_products_store_id_master_product_id_key` | `store_id, master_product_id` | UNIQUE | Composite unique |
| `store_products_store_id_idx` | `store_id` | BTREE | FK lookup |
| `store_products_master_product_id_idx` | `master_product_id` | BTREE | FK lookup |
| `store_products_availability_status_idx` | `availability_status` | BTREE | Filter by availability |
| `store_products_is_featured_idx` | `is_featured` | BTREE | Featured products |
| `store_products_store_id_availability_status_idx` | `store_id, availability_status` | BTREE | Store product listing filter |
| `store_products_store_id_is_featured_idx` | `store_id, is_featured` | BTREE | Store featured products |

---

### Table: `inventory`

Prisma Model: `Inventory`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique inventory record |
| `store_product_id` 🔗 | `uuid` | FK → `store_products.id`, UQ, NN | — | One-to-one with StoreProduct (CASCADE DELETE) |
| `stock_quantity` | `integer` | NN | `0` | Current total stock units |
| `reserved_quantity` | `integer` | NN | `0` | Units reserved for pending orders |
| `low_stock_threshold` | `integer` | NN | `10` | Alert threshold for low stock |
| `reorder_level` | `integer` | NN | `20` | Level at which to trigger restock |
| `version` | `integer` | NN | `0` | Optimistic concurrency control version |
| `last_stock_update` | `timestamptz(6)` | — | `NULL` | Timestamp of last stock change |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

> **Available Stock** = `stock_quantity - reserved_quantity`

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `inventory_pkey` | `id` | UNIQUE | Primary key |
| `inventory_store_product_id_key` | `store_product_id` | UNIQUE | One per store product |
| `inventory_stock_quantity_idx` | `stock_quantity` | BTREE | Low-stock monitoring |
| `inventory_last_stock_update_idx` | `last_stock_update` | BTREE | Recent update queries |

---

### Table: `inventory_transactions`

Prisma Model: `InventoryTransaction`

> **Append-only ledger.** No `updated_at` or soft-delete. Records are never modified.

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique transaction record |
| `inventory_id` 🔗 | `uuid` | FK → `inventory.id`, NN | — | Associated inventory (CASCADE DELETE) |
| `transaction_type` | `inventory_transaction_type` | NN | — | Type of stock movement |
| `quantity` | `integer` | NN | — | Units changed (positive = in, negative = out) |
| `balance_after_transaction` | `integer` | NN | — | Stock balance snapshot after this transaction |
| `reference_type` | `inventory_reference_type` | — | `NULL` | Type of source entity |
| `reference_id` | `uuid` | — | `NULL` | ID of source entity (order, purchase, etc.) |
| `source` | `varchar(100)` | — | `NULL` | Source system or service name |
| `notes` | `text` | — | `NULL` | Free-text notes |
| `created_by` | `uuid` | — | `NULL` | Audit: who created this entry |
| `created_at` | `timestamptz(6)` | NN | `now()` | Transaction timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `inventory_transactions_pkey` | `id` | UNIQUE | Primary key |
| `inventory_transactions_inventory_id_idx` | `inventory_id` | BTREE | All transactions for inventory |
| `inventory_transactions_transaction_type_idx` | `transaction_type` | BTREE | Filter by type |
| `inventory_transactions_reference_type_idx` | `reference_type` | BTREE | Polymorphic filter |
| `inventory_transactions_reference_type_reference_id_idx` | `reference_type, reference_id` | BTREE | Polymorphic lookup |
| `inventory_transactions_created_at_idx` | `created_at` | BTREE | Time-range queries |

---

## Module 4 — Cart & Wishlist

### Table: `carts`

Prisma Model: `Cart`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique cart identifier |
| `user_id` 🔗 | `uuid` | FK → `users.id`, NN | — | Cart owner (CASCADE DELETE) |
| `store_id` 🔗 | `uuid` | FK → `stores.id`, NN | — | Target store (RESTRICT DELETE) |
| `status` | `cart_status` | NN | `ACTIVE` | Cart lifecycle status |
| `subtotal` | `decimal(10,2)` | NN | `0.00` | Sum of all item subtotals |
| `discount_amount` | `decimal(10,2)` | NN | `0.00` | Total discount applied |
| `tax_amount` | `decimal(10,2)` | NN | `0.00` | Total GST amount |
| `delivery_fee` | `decimal(10,2)` | NN | `0.00` | Delivery charge |
| `total_amount` | `decimal(10,2)` | NN | `0.00` | Final payable amount |
| `notes` | `text` | — | `NULL` | Customer instructions |
| `expires_at` | `timestamptz(6)` | — | `NULL` | Cart TTL for abandonment |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz(6)` | — | `NULL` | Soft-delete timestamp |

**Constraints:**

| Constraint | Columns | Notes |
|---|---|---|
| `carts_user_id_store_id_key` | `user_id, store_id` | One cart per user per store |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `carts_pkey` | `id` | UNIQUE | Primary key |
| `carts_user_id_store_id_key` | `user_id, store_id` | UNIQUE | Composite unique |
| `carts_user_id_idx` | `user_id` | BTREE | All carts for user |
| `carts_store_id_idx` | `store_id` | BTREE | All carts for store |
| `carts_status_idx` | `status` | BTREE | Filter by status |
| `carts_expires_at_idx` | `expires_at` | BTREE | Expiry cleanup |
| `carts_user_id_status_idx` | `user_id, status` | BTREE | User's active cart |
| `carts_store_id_status_idx` | `store_id, status` | BTREE | Store's active carts |

---

### Table: `cart_items`

Prisma Model: `CartItem`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique cart item |
| `cart_id` 🔗 | `uuid` | FK → `carts.id`, NN | — | Parent cart (CASCADE DELETE) |
| `store_product_id` 🔗 | `uuid` | FK → `store_products.id`, NN | — | Listed product (RESTRICT DELETE) |
| `quantity` | `integer` | NN | — | Quantity added |
| `product_name_snapshot` | `varchar(200)` | NN | — | Product name at time of add |
| `unit_snapshot` | `varchar(50)` | NN | — | Unit description at time of add |
| `mrp_snapshot` | `decimal(10,2)` | NN | — | MRP at time of add |
| `selling_price_snapshot` | `decimal(10,2)` | NN | — | Selling price at time of add |
| `gst_rate_snapshot` | `decimal(5,2)` | NN | — | GST rate at time of add |
| `subtotal` | `decimal(10,2)` | NN | — | `quantity × selling_price_snapshot` |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

**Constraints:**

| Constraint | Columns | Notes |
|---|---|---|
| `cart_items_cart_id_store_product_id_key` | `cart_id, store_product_id` | One line per product per cart |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `cart_items_pkey` | `id` | UNIQUE | Primary key |
| `cart_items_cart_id_store_product_id_key` | `cart_id, store_product_id` | UNIQUE | Composite unique |
| `cart_items_cart_id_idx` | `cart_id` | BTREE | All items for cart |
| `cart_items_cart_id_store_product_id_idx` | `cart_id, store_product_id` | BTREE | Lookup specific item in cart |

---

### Table: `wishlists`

Prisma Model: `Wishlist`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique wishlist identifier |
| `user_id` 🔗 | `uuid` | FK → `users.id`, NN | — | Wishlist owner (CASCADE DELETE) |
| `name` | `varchar(100)` | NN | — | Wishlist name |
| `is_default` | `boolean` | NN | `false` | Whether this is the user's default wishlist |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz(6)` | — | `NULL` | Soft-delete timestamp |

**Constraints:**

| Constraint | Columns | Notes |
|---|---|---|
| `wishlists_user_id_name_key` | `user_id, name` | Unique name per user |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `wishlists_pkey` | `id` | UNIQUE | Primary key |
| `wishlists_user_id_name_key` | `user_id, name` | UNIQUE | Composite unique |
| `wishlists_user_id_idx` | `user_id` | BTREE | All wishlists for user |
| `wishlists_user_id_is_default_idx` | `user_id, is_default` | BTREE | Find default wishlist |

---

### Table: `wishlist_items`

Prisma Model: `WishlistItem`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique wishlist item |
| `wishlist_id` 🔗 | `uuid` | FK → `wishlists.id`, NN | — | Parent wishlist (CASCADE DELETE) |
| `store_product_id` 🔗 | `uuid` | FK → `store_products.id`, NN | — | Bookmarked product (RESTRICT DELETE) |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Bookmark timestamp |

**Constraints:**

| Constraint | Columns | Notes |
|---|---|---|
| `wishlist_items_wishlist_id_store_product_id_key` | `wishlist_id, store_product_id` | No duplicate bookmarks |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `wishlist_items_pkey` | `id` | UNIQUE | Primary key |
| `wishlist_items_wishlist_id_store_product_id_key` | `wishlist_id, store_product_id` | UNIQUE | Composite unique |
| `wishlist_items_wishlist_id_idx` | `wishlist_id` | BTREE | All items in wishlist |

---

## Module 5 — Order Management

### Table: `orders`

Prisma Model: `Order`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique order identifier |
| `user_id` 🔗 | `uuid` | FK → `users.id`, NN | — | Order placer (RESTRICT DELETE) |
| `store_id` 🔗 | `uuid` | FK → `stores.id`, NN | — | Order target store (RESTRICT DELETE) |
| `address_id` 🔗 | `uuid` | FK → `addresses.id`, NN | — | Delivery address reference (RESTRICT DELETE) |
| `order_number` | `varchar(50)` | UQ, NN | — | Human-readable order number |
| `status` | `order_status` | NN | `PENDING` | Order lifecycle status |
| `payment_status` | `payment_status` | NN | `PENDING` | Payment lifecycle status |
| `fulfillment_type` | `fulfillment_type` | NN | `DELIVERY` | Delivery or pickup |
| `subtotal` | `decimal(10,2)` | NN | `0.00` | Sum of all item subtotals |
| `discount_amount` | `decimal(10,2)` | NN | `0.00` | Discount applied |
| `tax_amount` | `decimal(10,2)` | NN | `0.00` | GST amount |
| `delivery_fee` | `decimal(10,2)` | NN | `0.00` | Delivery charge |
| `total_amount` | `decimal(10,2)` | NN | `0.00` | Final amount |
| `delivery_receiver_name` | `varchar(100)` | NN | — | **Snapshot**: receiver name at placement |
| `delivery_phone` | `varchar(20)` | NN | — | **Snapshot**: receiver phone |
| `delivery_email` | `varchar(255)` | — | `NULL` | **Snapshot**: receiver email |
| `delivery_house_no` | `varchar(100)` | NN | — | **Snapshot**: house number |
| `delivery_street` | `varchar(255)` | NN | — | **Snapshot**: street |
| `delivery_area` | `varchar(255)` | NN | — | **Snapshot**: area/locality |
| `delivery_landmark` | `varchar(255)` | — | `NULL` | **Snapshot**: landmark |
| `delivery_city` | `varchar(100)` | NN | — | **Snapshot**: city |
| `delivery_state` | `varchar(100)` | NN | — | **Snapshot**: state |
| `delivery_country` | `varchar(100)` | NN | — | **Snapshot**: country |
| `delivery_pincode` | `varchar(20)` | NN | — | **Snapshot**: pincode |
| `delivery_latitude` | `decimal(10,7)` | — | `NULL` | **Snapshot**: GPS latitude |
| `delivery_longitude` | `decimal(10,7)` | — | `NULL` | **Snapshot**: GPS longitude |
| `delivery_instructions` | `text` | — | `NULL` | Customer delivery instructions |
| `placed_at` | `timestamptz(6)` | NN | `now()` | Order placement timestamp |
| `version` | `integer` | NN | `0` | Optimistic concurrency control version |
| `confirmed_at` | `timestamptz(6)` | — | `NULL` | When store confirmed the order |
| `packed_at` | `timestamptz(6)` | — | `NULL` | When order was packed |
| `out_for_delivery_at` | `timestamptz(6)` | — | `NULL` | When delivery started |
| `delivered_at` | `timestamptz(6)` | — | `NULL` | When delivered to customer |
| `cancelled_at` | `timestamptz(6)` | — | `NULL` | When/if cancelled |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |
| `deleted_at` | `timestamptz(6)` | — | `NULL` | Soft-delete timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `orders_pkey` | `id` | UNIQUE | Primary key |
| `orders_order_number_key` | `order_number` | UNIQUE | — |
| `orders_user_id_idx` | `user_id` | BTREE | All orders for user |
| `orders_store_id_idx` | `store_id` | BTREE | All orders for store |
| `orders_status_idx` | `status` | BTREE | Filter by order status |
| `orders_payment_status_idx` | `payment_status` | BTREE | Filter by payment status |
| `orders_placed_at_idx` | `placed_at` | BTREE | Time-range queries |
| `orders_user_id_status_idx` | `user_id, status` | BTREE | User order history by status |
| `orders_store_id_status_idx` | `store_id, status` | BTREE | Store pending orders |
| `orders_user_id_placed_at_idx` | `user_id, placed_at` | BTREE | User order timeline |

---

### Table: `order_items`

Prisma Model: `OrderItem`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique order item |
| `order_id` 🔗 | `uuid` | FK → `orders.id`, NN | — | Parent order (CASCADE DELETE) |
| `store_product_id` 🔗 | `uuid` | FK → `store_products.id`, NN | — | Ordered product (RESTRICT DELETE) |
| `quantity` | `integer` | NN | — | Ordered quantity |
| `product_name_snapshot` | `varchar(200)` | NN | — | **Snapshot**: product name at placement |
| `unit_snapshot` | `varchar(50)` | NN | — | **Snapshot**: unit at placement |
| `mrp_snapshot` | `decimal(10,2)` | NN | — | **Snapshot**: MRP at placement |
| `selling_price_snapshot` | `decimal(10,2)` | NN | — | **Snapshot**: selling price at placement |
| `gst_rate_snapshot` | `decimal(5,2)` | NN | — | **Snapshot**: GST rate at placement |
| `subtotal` | `decimal(10,2)` | NN | — | `quantity × selling_price_snapshot` |
| `fulfillment_status` | `fulfillment_status` | NN | `PENDING` | Per-item fulfillment tracking |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `order_items_pkey` | `id` | UNIQUE | Primary key |
| `order_items_order_id_idx` | `order_id` | BTREE | All items for order |
| `order_items_order_id_fulfillment_status_idx` | `order_id, fulfillment_status` | BTREE | Partial fulfillment queries |

---

### Table: `order_item_replacements`

Prisma Model: `OrderItemReplacement`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique replacement record |
| `order_item_id` 🔗 | `uuid` | FK → `order_items.id`, NN | — | Original item (CASCADE DELETE) |
| `replacement_store_product_id` 🔗 | `uuid` | FK → `store_products.id`, NN | — | Proposed replacement product (RESTRICT DELETE) |
| `status` | `replacement_status` | NN | `PENDING` | Replacement decision status |
| `replacement_product_name_snapshot` | `varchar(200)` | NN | — | **Snapshot**: replacement product name |
| `replacement_unit_snapshot` | `varchar(50)` | NN | — | **Snapshot**: replacement unit |
| `replacement_mrp_snapshot` | `decimal(10,2)` | NN | — | **Snapshot**: replacement MRP |
| `replacement_selling_price_snapshot` | `decimal(10,2)` | NN | — | **Snapshot**: replacement selling price |
| `replacement_gst_rate_snapshot` | `decimal(5,2)` | NN | — | **Snapshot**: replacement GST rate |
| `replacement_subtotal` | `decimal(10,2)` | NN | — | Replacement line total |
| `merchant_reason` | `text` | — | `NULL` | Merchant's reason for replacement |
| `customer_response` | `text` | — | `NULL` | Customer's accept/reject response |
| `requested_at` | `timestamptz(6)` | NN | `now()` | When merchant proposed replacement |
| `responded_at` | `timestamptz(6)` | — | `NULL` | When customer responded |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `order_item_replacements_pkey` | `id` | UNIQUE | Primary key |
| `order_item_replacements_order_item_id_idx` | `order_item_id` | BTREE | Replacements for item |
| `order_item_replacements_order_item_id_status_idx` | `order_item_id, status` | BTREE | Filter by decision status |

---

### Table: `order_status_history`

Prisma Model: `OrderStatusHistory`

> **Append-only audit log.** No `updated_at` field. Records are never modified.

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique history record |
| `order_id` 🔗 | `uuid` | FK → `orders.id`, NN | — | Associated order (CASCADE DELETE) |
| `previous_status` | `order_status` | — | `NULL` | Status before transition (null for initial) |
| `new_status` | `order_status` | NN | — | Status after transition |
| `remarks` | `text` | — | `NULL` | Optional transition remarks |
| `created_by` | `uuid` | — | `NULL` | Who triggered the transition |
| `created_at` | `timestamptz(6)` | NN | `now()` | Transition timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `order_status_history_pkey` | `id` | UNIQUE | Primary key |
| `order_status_history_order_id_idx` | `order_id` | BTREE | All status changes for order |
| `order_status_history_order_id_created_at_idx` | `order_id, created_at` | BTREE | Chronological timeline |

---

### Table: `order_notes`

Prisma Model: `OrderNote`

> **Append-only.** No `updated_at` field.

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique note record |
| `order_id` 🔗 | `uuid` | FK → `orders.id`, NN | — | Associated order (CASCADE DELETE) |
| `note_type` | `order_note_type` | NN | — | Who wrote the note |
| `note` | `text` | NN | — | Note content |
| `created_by` | `uuid` | — | `NULL` | Who wrote the note |
| `created_at` | `timestamptz(6)` | NN | `now()` | Note creation timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `order_notes_pkey` | `id` | UNIQUE | Primary key |
| `order_notes_order_id_idx` | `order_id` | BTREE | All notes for order |
| `order_notes_order_id_created_at_idx` | `order_id, created_at` | BTREE | Chronological notes |

---

## Module 6 — Payment & Financial Management

### Table: `payments`

Prisma Model: `Payment`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique payment record |
| `order_id` 🔗 | `uuid` | FK → `orders.id`, UQ, NN | — | One-to-one with Order (CASCADE DELETE) |
| `payment_method` | `payment_method` | NN | — | Payment method used |
| `payment_status` | `payment_status` | NN | `PENDING` | Aggregated payment status |
| `gateway` | `payment_gateway` | NN | — | Payment gateway used |
| `payable_amount` | `decimal(10,2)` | NN | — | Total amount to be paid |
| `paid_amount` | `decimal(10,2)` | NN | `0` | Amount actually received |
| `refunded_amount` | `decimal(10,2)` | NN | `0` | Total amount refunded |
| `currency` | `varchar(10)` | NN | `INR` | ISO 4217 currency code |
| `paid_at` | `timestamptz(6)` | — | `NULL` | When payment was confirmed |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `payments_pkey` | `id` | UNIQUE | Primary key |
| `payments_order_id_key` | `order_id` | UNIQUE | One per order |
| `payments_payment_status_idx` | `payment_status` | BTREE | Filter by status |
| `payments_payment_method_idx` | `payment_method` | BTREE | Filter by method |
| `payments_gateway_idx` | `gateway` | BTREE | Filter by gateway |
| `payments_paid_at_idx` | `paid_at` | BTREE | Revenue time-series |
| `payments_gateway_payment_status_idx` | `gateway, payment_status` | BTREE | Gateway reconciliation |

---

### Table: `payment_transactions`

Prisma Model: `PaymentTransaction`

> **Append-only.** Each gateway charge attempt is a new row.

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique transaction record |
| `payment_id` 🔗 | `uuid` | FK → `payments.id`, NN | — | Parent payment (CASCADE DELETE) |
| `gateway` | `payment_gateway` | NN | — | Gateway used for this attempt |
| `gateway_order_id` | `varchar(255)` | — | `NULL` | Gateway's order ID (e.g. Razorpay order) |
| `gateway_payment_id` | `varchar(255)` | — | `NULL` | Gateway's payment ID after charge |
| `gateway_signature` | `varchar(500)` | — | `NULL` | HMAC-SHA256 signature for verification |
| `transaction_status` | `payment_transaction_status` | NN | `INITIATED` | Transaction attempt status |
| `amount` | `decimal(10,2)` | NN | — | Amount charged in this attempt |
| `currency` | `varchar(10)` | NN | `INR` | ISO 4217 currency code |
| `gateway_response` | `jsonb` | — | `NULL` | Raw gateway response JSON |
| `failure_reason` | `text` | — | `NULL` | Failure message if transaction failed |
| `processed_at` | `timestamptz(6)` | — | `NULL` | When gateway processed this transaction |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Transaction initiation timestamp |

**Constraints:**

| Constraint | Columns | Notes |
|---|---|---|
| `payment_transactions_gateway_gateway_payment_id_key` | `gateway, gateway_payment_id` | Prevent duplicate gateway transaction entries |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `payment_transactions_pkey` | `id` | UNIQUE | Primary key |
| `payment_transactions_gateway_gateway_payment_id_key` | `gateway, gateway_payment_id` | UNIQUE | Idempotency |
| `payment_transactions_payment_id_idx` | `payment_id` | BTREE | All attempts for payment |
| `payment_transactions_payment_id_transaction_status_idx` | `payment_id, transaction_status` | BTREE | Filter by status |
| `payment_transactions_transaction_status_idx` | `transaction_status` | BTREE | Platform-wide filter |
| `payment_transactions_gateway_idx` | `gateway` | BTREE | Filter by gateway |
| `payment_transactions_gateway_order_id_idx` | `gateway_order_id` | BTREE | Lookup by gateway order |
| `payment_transactions_gateway_payment_id_idx` | `gateway_payment_id` | BTREE | Lookup by gateway payment |
| `payment_transactions_processed_at_idx` | `processed_at` | BTREE | Time-range queries |

---

### Table: `refunds`

Prisma Model: `Refund`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique refund record |
| `payment_id` 🔗 | `uuid` | FK → `payments.id`, NN | — | Parent payment (CASCADE DELETE) |
| `refund_amount` | `decimal(10,2)` | NN | — | Amount to be refunded |
| `refund_status` | `refund_status` | NN | `PENDING` | Refund processing status |
| `gateway_refund_id` | `varchar(255)` | — | `NULL` | Gateway's refund reference ID |
| `refund_reason` | `text` | — | `NULL` | Reason for refund |
| `gateway_response` | `jsonb` | — | `NULL` | Raw gateway refund response JSON |
| `refunded_at` | `timestamptz(6)` | — | `NULL` | When refund was processed |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `updated_by` | `uuid` | — | `NULL` | Audit: last updater user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz(6)` | NN | auto | Last update timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `refunds_pkey` | `id` | UNIQUE | Primary key |
| `refunds_payment_id_idx` | `payment_id` | BTREE | All refunds for payment |
| `refunds_refund_status_idx` | `refund_status` | BTREE | Filter pending refunds |
| `refunds_gateway_refund_id_idx` | `gateway_refund_id` | BTREE | Lookup by gateway ref |
| `refunds_refunded_at_idx` | `refunded_at` | BTREE | Time-series |

---

### Table: `payment_webhooks`

Prisma Model: `PaymentWebhook`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique webhook event record |
| `payment_id` 🔗 | `uuid` | FK → `payments.id`, NN | — | Associated payment (CASCADE DELETE) |
| `gateway_event_id` | `varchar(255)` | UQ, NN | — | Gateway's unique event ID (idempotency key) |
| `event_type` | `varchar(100)` | NN | — | Gateway event type (e.g. `payment.captured`) |
| `payload` | `jsonb` | NN | — | Full raw webhook payload |
| `is_processed` | `boolean` | NN | `false` | Whether this event has been processed |
| `processed_at` | `timestamptz(6)` | — | `NULL` | When processing completed |
| `processing_error` | `text` | — | `NULL` | Error message if processing failed |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | When webhook was received |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `payment_webhooks_pkey` | `id` | UNIQUE | Primary key |
| `payment_webhooks_gateway_event_id_key` | `gateway_event_id` | UNIQUE | Idempotent delivery |
| `payment_webhooks_payment_id_idx` | `payment_id` | BTREE | All webhooks for payment |
| `payment_webhooks_event_type_idx` | `event_type` | BTREE | Filter by event type |
| `payment_webhooks_is_processed_idx` | `is_processed` | BTREE | Find unprocessed events |
| `payment_webhooks_processed_at_idx` | `processed_at` | BTREE | Time-series |

---

### Table: `financial_documents`

Prisma Model: `FinancialDocument`

| Column | DB Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` 🔑 | `uuid` | PK, NN | `gen_random_uuid()` | Unique document record |
| `order_id` 🔗 | `uuid` | FK → `orders.id`, NN | — | Associated order (CASCADE DELETE) |
| `document_type` | `financial_document_type` | NN | — | Type of financial document |
| `document_number` | `varchar(100)` | UQ, NN | — | Sequential document number (tax-compliant) |
| `pdf_key` | `varchar(500)` | NN | — | Object storage key for PDF file |
| `generated_at` | `timestamptz(6)` | NN | `now()` | When document was generated |
| `created_by` | `uuid` | — | `NULL` | Audit: creator user ID |
| `created_at` | `timestamptz(6)` | NN | `now()` | Record creation timestamp |

**Indexes:**

| Index Name | Columns | Type | Notes |
|---|---|---|---|
| `financial_documents_pkey` | `id` | UNIQUE | Primary key |
| `financial_documents_document_number_key` | `document_number` | UNIQUE | Sequential numbering |
| `financial_documents_order_id_idx` | `order_id` | BTREE | Documents for order |
| `financial_documents_order_id_document_type_idx` | `order_id, document_type` | BTREE | Filter by type per order |
| `financial_documents_document_type_idx` | `document_type` | BTREE | Platform-wide filter |
| `financial_documents_generated_at_idx` | `generated_at` | BTREE | Time-series queries |

---

## Summary — Tables & Counts

| Module | Tables | Enums |
|---|---|---|
| 1 — IAM | 7 (`roles`, `permissions`, `role_permissions`, `users`, `addresses`, `business_otps`, `user_sessions`) | 6 |
| 2 — Store | 4 (`stores`, `store_images`, `store_hours`, `store_delivery_settings`) | 3 |
| 3 — Catalog & Inventory | 8 (`categories`, `brands`, `units`, `master_products`, `product_images`, `store_products`, `inventory`, `inventory_transactions`) | 5 |
| 4 — Cart & Wishlist | 4 (`carts`, `cart_items`, `wishlists`, `wishlist_items`) | 1 |
| 5 — Order Management | 5 (`orders`, `order_items`, `order_item_replacements`, `order_status_history`, `order_notes`) | 5 |
| 6 — Payment & Financial | 5 (`payments`, `payment_transactions`, `refunds`, `payment_webhooks`, `financial_documents`) | 6 |
| **Total** | **33 tables** | **26 enums** |

---

*End of Data Dictionary v0.1*

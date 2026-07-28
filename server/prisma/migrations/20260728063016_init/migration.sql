-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "otp_purpose" AS ENUM ('ORDER_DELIVERY', 'ORDER_PICKUP', 'ACCOUNT_RECOVERY', 'SENSITIVE_ACTION');

-- CreateEnum
CREATE TYPE "otp_channel" AS ENUM ('SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "business_otp_reference_type" AS ENUM ('ORDER', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "device_type" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'WEB');

-- CreateEnum
CREATE TYPE "revocation_reason" AS ENUM ('LOGOUT', 'PASSWORD_CHANGED', 'TOKEN_ROTATED', 'ACCOUNT_LOCKED', 'SECURITY', 'EXPIRED');

-- CreateEnum
CREATE TYPE "store_status" AS ENUM ('PENDING', 'ACTIVE', 'TEMPORARILY_CLOSED', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "week_day" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "product_image_type" AS ENUM ('PRIMARY', 'GALLERY');

-- CreateEnum
CREATE TYPE "availability_status" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK', 'HIDDEN', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "inventory_transaction_type" AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'RESTOCK', 'ADJUSTMENT', 'DAMAGE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "inventory_reference_type" AS ENUM ('ORDER', 'PURCHASE', 'RETURN', 'MANUAL');

-- CreateEnum
CREATE TYPE "cart_status" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "fulfillment_type" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "fulfillment_status" AS ENUM ('PENDING', 'CONFIRMED', 'REPLACED', 'CANCELLED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "replacement_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "order_note_type" AS ENUM ('CUSTOMER', 'MERCHANT', 'SYSTEM', 'DELIVERY_PARTNER');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('COD', 'UPI', 'CARD', 'NET_BANKING', 'WALLET');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "payment_gateway" AS ENUM ('RAZORPAY', 'CASH');

-- CreateEnum
CREATE TYPE "payment_transaction_status" AS ENUM ('INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "financial_document_type" AS ENUM ('INVOICE', 'RECEIPT', 'CREDIT_NOTE');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "phone" VARCHAR(15),
    "email" VARCHAR(255),
    "status" "user_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "email_verified_at" TIMESTAMP(3),
    "phone_verified_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(50),
    "receiver_name" VARCHAR(100) NOT NULL,
    "receiver_phone" VARCHAR(15) NOT NULL,
    "house_no" VARCHAR(100) NOT NULL,
    "street" VARCHAR(255),
    "area" VARCHAR(255) NOT NULL,
    "landmark" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_otps" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "reference_type" "business_otp_reference_type",
    "reference_id" UUID,
    "purpose" "otp_purpose" NOT NULL,
    "channel" "otp_channel" NOT NULL,
    "destination" VARCHAR(255) NOT NULL,
    "otp_hash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "last_attempt_at" TIMESTAMP(3),
    "blocked_until" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_type" "device_type" NOT NULL,
    "device_name" VARCHAR(255),
    "device_id" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "revocation_reason" "revocation_reason",
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "gst_number" VARCHAR(20),
    "business_registration_number" VARCHAR(50),
    "logo_key" VARCHAR(500),
    "banner_key" VARCHAR(500),
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(20) NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    "status" "store_status" NOT NULL DEFAULT 'PENDING',
    "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMPTZ(6),
    "verified_by_id" UUID,
    "is_open" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_images" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "object_key" VARCHAR(500) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "store_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_hours" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "week_day" "week_day" NOT NULL,
    "opening_time" TIME(6),
    "closing_time" TIME(6),
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "store_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_delivery_settings" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "is_delivery_available" BOOLEAN NOT NULL DEFAULT true,
    "is_pickup_available" BOOLEAN NOT NULL DEFAULT true,
    "minimum_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "delivery_radius_km" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "delivery_charge" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "free_delivery_above" DECIMAL(10,2),
    "estimated_delivery_time" INTEGER NOT NULL DEFAULT 30,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "store_delivery_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parent_category_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(170) NOT NULL,
    "description" TEXT,
    "image_key" VARCHAR(500),
    "icon_key" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(170) NOT NULL,
    "logo_key" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_products" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "brand_id" UUID,
    "unit_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "sku" VARCHAR(100) NOT NULL,
    "barcode" VARCHAR(100),
    "hsn_code" VARCHAR(20),
    "gst_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "unit_value" DECIMAL(10,2) NOT NULL,
    "is_veg" BOOLEAN,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "product_status" NOT NULL DEFAULT 'ACTIVE',
    "searchVector" tsvector,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "master_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "master_product_id" UUID NOT NULL,
    "object_key" VARCHAR(500) NOT NULL,
    "image_type" "product_image_type" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_products" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "master_product_id" UUID NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "availability_status" "availability_status" NOT NULL DEFAULT 'AVAILABLE',
    "track_inventory" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "store_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL,
    "store_product_id" UUID NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "reorder_level" INTEGER NOT NULL DEFAULT 20,
    "version" INTEGER NOT NULL DEFAULT 0,
    "last_stock_update" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "transaction_type" "inventory_transaction_type" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balance_after_transaction" INTEGER NOT NULL,
    "reference_type" "inventory_reference_type",
    "reference_id" UUID,
    "source" VARCHAR(100),
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "status" "cart_status" NOT NULL DEFAULT 'ACTIVE',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "store_product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "product_name_snapshot" VARCHAR(200) NOT NULL,
    "unit_snapshot" VARCHAR(50) NOT NULL,
    "mrp_snapshot" DECIMAL(10,2) NOT NULL,
    "selling_price_snapshot" DECIMAL(10,2) NOT NULL,
    "gst_rate_snapshot" DECIMAL(5,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL,
    "wishlist_id" UUID NOT NULL,
    "store_product_id" UUID NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'PENDING',
    "payment_status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "fulfillment_type" "fulfillment_type" NOT NULL DEFAULT 'DELIVERY',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "delivery_receiver_name" VARCHAR(100) NOT NULL,
    "delivery_phone" VARCHAR(20) NOT NULL,
    "delivery_email" VARCHAR(255),
    "delivery_house_no" VARCHAR(100) NOT NULL,
    "delivery_street" VARCHAR(255) NOT NULL,
    "delivery_area" VARCHAR(255) NOT NULL,
    "delivery_landmark" VARCHAR(255),
    "delivery_city" VARCHAR(100) NOT NULL,
    "delivery_state" VARCHAR(100) NOT NULL,
    "delivery_country" VARCHAR(100) NOT NULL,
    "delivery_pincode" VARCHAR(20) NOT NULL,
    "delivery_latitude" DECIMAL(10,7),
    "delivery_longitude" DECIMAL(10,7),
    "delivery_instructions" TEXT,
    "placed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,
    "confirmed_at" TIMESTAMPTZ(6),
    "packed_at" TIMESTAMPTZ(6),
    "out_for_delivery_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "store_product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "product_name_snapshot" VARCHAR(200) NOT NULL,
    "unit_snapshot" VARCHAR(50) NOT NULL,
    "mrp_snapshot" DECIMAL(10,2) NOT NULL,
    "selling_price_snapshot" DECIMAL(10,2) NOT NULL,
    "gst_rate_snapshot" DECIMAL(5,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "fulfillment_status" "fulfillment_status" NOT NULL DEFAULT 'PENDING',
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_replacements" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "replacement_store_product_id" UUID NOT NULL,
    "status" "replacement_status" NOT NULL DEFAULT 'PENDING',
    "replacement_product_name_snapshot" VARCHAR(200) NOT NULL,
    "replacement_unit_snapshot" VARCHAR(50) NOT NULL,
    "replacement_mrp_snapshot" DECIMAL(10,2) NOT NULL,
    "replacement_selling_price_snapshot" DECIMAL(10,2) NOT NULL,
    "replacement_gst_rate_snapshot" DECIMAL(5,2) NOT NULL,
    "replacement_subtotal" DECIMAL(10,2) NOT NULL,
    "merchant_reason" TEXT,
    "customer_response" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_item_replacements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "previous_status" "order_status",
    "new_status" "order_status" NOT NULL,
    "remarks" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_notes" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "note_type" "order_note_type" NOT NULL,
    "note" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "payment_status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "gateway" "payment_gateway" NOT NULL,
    "payable_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refunded_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "paid_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "gateway" "payment_gateway" NOT NULL,
    "gateway_order_id" VARCHAR(255),
    "gateway_payment_id" VARCHAR(255),
    "gateway_signature" VARCHAR(500),
    "transaction_status" "payment_transaction_status" NOT NULL DEFAULT 'INITIATED',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "gateway_response" JSONB,
    "failure_reason" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "refund_amount" DECIMAL(10,2) NOT NULL,
    "refund_status" "refund_status" NOT NULL DEFAULT 'PENDING',
    "gateway_refund_id" VARCHAR(255),
    "refund_reason" TEXT,
    "gateway_response" JSONB,
    "refunded_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhooks" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "gateway_event_id" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMPTZ(6),
    "processing_error" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_documents" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "document_type" "financial_document_type" NOT NULL,
    "document_number" VARCHAR(100) NOT NULL,
    "pdf_key" VARCHAR(500) NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_is_active_idx" ON "roles"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permissions_is_active_idx" ON "permissions"("is_active");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE INDEX "addresses_user_id_is_default_idx" ON "addresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "addresses_city_idx" ON "addresses"("city");

-- CreateIndex
CREATE INDEX "addresses_pincode_idx" ON "addresses"("pincode");

-- CreateIndex
CREATE INDEX "business_otps_user_id_idx" ON "business_otps"("user_id");

-- CreateIndex
CREATE INDEX "business_otps_reference_type_reference_id_idx" ON "business_otps"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "business_otps_purpose_idx" ON "business_otps"("purpose");

-- CreateIndex
CREATE INDEX "business_otps_channel_idx" ON "business_otps"("channel");

-- CreateIndex
CREATE INDEX "business_otps_destination_idx" ON "business_otps"("destination");

-- CreateIndex
CREATE INDEX "business_otps_expires_at_idx" ON "business_otps"("expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_device_id_idx" ON "user_sessions"("user_id", "device_id");

-- CreateIndex
CREATE INDEX "user_sessions_last_activity_at_idx" ON "user_sessions"("last_activity_at");

-- CreateIndex
CREATE INDEX "user_sessions_revoked_at_idx" ON "user_sessions"("revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "stores_owner_id_key" ON "stores"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "stores_phone_key" ON "stores"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "stores_email_key" ON "stores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stores_gst_number_key" ON "stores"("gst_number");

-- CreateIndex
CREATE UNIQUE INDEX "stores_business_registration_number_key" ON "stores"("business_registration_number");

-- CreateIndex
CREATE INDEX "stores_status_idx" ON "stores"("status");

-- CreateIndex
CREATE INDEX "stores_verification_status_idx" ON "stores"("verification_status");

-- CreateIndex
CREATE INDEX "stores_city_idx" ON "stores"("city");

-- CreateIndex
CREATE INDEX "stores_state_idx" ON "stores"("state");

-- CreateIndex
CREATE INDEX "stores_pincode_idx" ON "stores"("pincode");

-- CreateIndex
CREATE INDEX "stores_latitude_longitude_idx" ON "stores"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "stores_owner_id_idx" ON "stores"("owner_id");

-- CreateIndex
CREATE INDEX "stores_verified_by_id_idx" ON "stores"("verified_by_id");

-- CreateIndex
CREATE INDEX "stores_is_open_idx" ON "stores"("is_open");

-- CreateIndex
CREATE INDEX "store_images_store_id_idx" ON "store_images"("store_id");

-- CreateIndex
CREATE INDEX "store_images_store_id_display_order_idx" ON "store_images"("store_id", "display_order");

-- CreateIndex
CREATE INDEX "store_hours_store_id_idx" ON "store_hours"("store_id");

-- CreateIndex
CREATE INDEX "store_hours_week_day_idx" ON "store_hours"("week_day");

-- CreateIndex
CREATE UNIQUE INDEX "store_hours_store_id_week_day_key" ON "store_hours"("store_id", "week_day");

-- CreateIndex
CREATE UNIQUE INDEX "store_delivery_settings_store_id_key" ON "store_delivery_settings"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_category_id_idx" ON "categories"("parent_category_id");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

-- CreateIndex
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_slug_idx" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_is_active_idx" ON "brands"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "units_symbol_key" ON "units"("symbol");

-- CreateIndex
CREATE INDEX "units_is_active_idx" ON "units"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "master_products_slug_key" ON "master_products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "master_products_sku_key" ON "master_products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "master_products_barcode_key" ON "master_products"("barcode");

-- CreateIndex
CREATE INDEX "master_products_category_id_idx" ON "master_products"("category_id");

-- CreateIndex
CREATE INDEX "master_products_brand_id_idx" ON "master_products"("brand_id");

-- CreateIndex
CREATE INDEX "master_products_unit_id_idx" ON "master_products"("unit_id");

-- CreateIndex
CREATE INDEX "master_products_status_idx" ON "master_products"("status");

-- CreateIndex
CREATE INDEX "master_products_is_featured_idx" ON "master_products"("is_featured");

-- CreateIndex
CREATE INDEX "master_products_slug_idx" ON "master_products"("slug");

-- CreateIndex
CREATE INDEX "master_products_sku_idx" ON "master_products"("sku");

-- CreateIndex
CREATE INDEX "master_products_barcode_idx" ON "master_products"("barcode");

-- CreateIndex
CREATE INDEX "product_images_master_product_id_idx" ON "product_images"("master_product_id");

-- CreateIndex
CREATE INDEX "product_images_master_product_id_display_order_idx" ON "product_images"("master_product_id", "display_order");

-- CreateIndex
CREATE INDEX "product_images_master_product_id_is_primary_idx" ON "product_images"("master_product_id", "is_primary");

-- CreateIndex
CREATE INDEX "store_products_store_id_idx" ON "store_products"("store_id");

-- CreateIndex
CREATE INDEX "store_products_master_product_id_idx" ON "store_products"("master_product_id");

-- CreateIndex
CREATE INDEX "store_products_availability_status_idx" ON "store_products"("availability_status");

-- CreateIndex
CREATE INDEX "store_products_is_featured_idx" ON "store_products"("is_featured");

-- CreateIndex
CREATE INDEX "store_products_store_id_availability_status_idx" ON "store_products"("store_id", "availability_status");

-- CreateIndex
CREATE INDEX "store_products_store_id_is_featured_idx" ON "store_products"("store_id", "is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "store_products_store_id_master_product_id_key" ON "store_products"("store_id", "master_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_store_product_id_key" ON "inventory"("store_product_id");

-- CreateIndex
CREATE INDEX "inventory_stock_quantity_idx" ON "inventory"("stock_quantity");

-- CreateIndex
CREATE INDEX "inventory_last_stock_update_idx" ON "inventory"("last_stock_update");

-- CreateIndex
CREATE INDEX "inventory_transactions_inventory_id_idx" ON "inventory_transactions"("inventory_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_transaction_type_idx" ON "inventory_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "inventory_transactions_reference_type_idx" ON "inventory_transactions"("reference_type");

-- CreateIndex
CREATE INDEX "inventory_transactions_reference_type_reference_id_idx" ON "inventory_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_created_at_idx" ON "inventory_transactions"("created_at");

-- CreateIndex
CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "carts_store_id_idx" ON "carts"("store_id");

-- CreateIndex
CREATE INDEX "carts_status_idx" ON "carts"("status");

-- CreateIndex
CREATE INDEX "carts_expires_at_idx" ON "carts"("expires_at");

-- CreateIndex
CREATE INDEX "carts_user_id_status_idx" ON "carts"("user_id", "status");

-- CreateIndex
CREATE INDEX "carts_store_id_status_idx" ON "carts"("store_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_store_id_key" ON "carts"("user_id", "store_id");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_store_product_id_idx" ON "cart_items"("cart_id", "store_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_store_product_id_key" ON "cart_items"("cart_id", "store_product_id");

-- CreateIndex
CREATE INDEX "wishlists_user_id_idx" ON "wishlists"("user_id");

-- CreateIndex
CREATE INDEX "wishlists_user_id_is_default_idx" ON "wishlists"("user_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_name_key" ON "wishlists"("user_id", "name");

-- CreateIndex
CREATE INDEX "wishlist_items_wishlist_id_idx" ON "wishlist_items"("wishlist_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_store_product_id_key" ON "wishlist_items"("wishlist_id", "store_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_store_id_idx" ON "orders"("store_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_payment_status_idx" ON "orders"("payment_status");

-- CreateIndex
CREATE INDEX "orders_placed_at_idx" ON "orders"("placed_at");

-- CreateIndex
CREATE INDEX "orders_user_id_status_idx" ON "orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "orders_store_id_status_idx" ON "orders"("store_id", "status");

-- CreateIndex
CREATE INDEX "orders_user_id_placed_at_idx" ON "orders"("user_id", "placed_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_fulfillment_status_idx" ON "order_items"("order_id", "fulfillment_status");

-- CreateIndex
CREATE INDEX "order_item_replacements_order_item_id_idx" ON "order_item_replacements"("order_item_id");

-- CreateIndex
CREATE INDEX "order_item_replacements_order_item_id_status_idx" ON "order_item_replacements"("order_item_id", "status");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_notes_order_id_idx" ON "order_notes"("order_id");

-- CreateIndex
CREATE INDEX "order_notes_order_id_created_at_idx" ON "order_notes"("order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_payment_status_idx" ON "payments"("payment_status");

-- CreateIndex
CREATE INDEX "payments_payment_method_idx" ON "payments"("payment_method");

-- CreateIndex
CREATE INDEX "payments_gateway_idx" ON "payments"("gateway");

-- CreateIndex
CREATE INDEX "payments_paid_at_idx" ON "payments"("paid_at");

-- CreateIndex
CREATE INDEX "payments_gateway_payment_status_idx" ON "payments"("gateway", "payment_status");

-- CreateIndex
CREATE INDEX "payment_transactions_payment_id_idx" ON "payment_transactions"("payment_id");

-- CreateIndex
CREATE INDEX "payment_transactions_payment_id_transaction_status_idx" ON "payment_transactions"("payment_id", "transaction_status");

-- CreateIndex
CREATE INDEX "payment_transactions_transaction_status_idx" ON "payment_transactions"("transaction_status");

-- CreateIndex
CREATE INDEX "payment_transactions_gateway_idx" ON "payment_transactions"("gateway");

-- CreateIndex
CREATE INDEX "payment_transactions_gateway_order_id_idx" ON "payment_transactions"("gateway_order_id");

-- CreateIndex
CREATE INDEX "payment_transactions_gateway_payment_id_idx" ON "payment_transactions"("gateway_payment_id");

-- CreateIndex
CREATE INDEX "payment_transactions_processed_at_idx" ON "payment_transactions"("processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_gateway_gateway_payment_id_key" ON "payment_transactions"("gateway", "gateway_payment_id");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "refunds_refund_status_idx" ON "refunds"("refund_status");

-- CreateIndex
CREATE INDEX "refunds_gateway_refund_id_idx" ON "refunds"("gateway_refund_id");

-- CreateIndex
CREATE INDEX "refunds_refunded_at_idx" ON "refunds"("refunded_at");

-- CreateIndex
CREATE INDEX "payment_webhooks_payment_id_idx" ON "payment_webhooks"("payment_id");

-- CreateIndex
CREATE INDEX "payment_webhooks_event_type_idx" ON "payment_webhooks"("event_type");

-- CreateIndex
CREATE INDEX "payment_webhooks_is_processed_idx" ON "payment_webhooks"("is_processed");

-- CreateIndex
CREATE INDEX "payment_webhooks_processed_at_idx" ON "payment_webhooks"("processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhooks_gateway_event_id_key" ON "payment_webhooks"("gateway_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_documents_document_number_key" ON "financial_documents"("document_number");

-- CreateIndex
CREATE INDEX "financial_documents_order_id_idx" ON "financial_documents"("order_id");

-- CreateIndex
CREATE INDEX "financial_documents_order_id_document_type_idx" ON "financial_documents"("order_id", "document_type");

-- CreateIndex
CREATE INDEX "financial_documents_document_type_idx" ON "financial_documents"("document_type");

-- CreateIndex
CREATE INDEX "financial_documents_generated_at_idx" ON "financial_documents"("generated_at");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_otps" ADD CONSTRAINT "business_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_images" ADD CONSTRAINT "store_images_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_hours" ADD CONSTRAINT "store_hours_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_delivery_settings" ADD CONSTRAINT "store_delivery_settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_master_product_id_fkey" FOREIGN KEY ("master_product_id") REFERENCES "master_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_master_product_id_fkey" FOREIGN KEY ("master_product_id") REFERENCES "master_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_store_product_id_fkey" FOREIGN KEY ("store_product_id") REFERENCES "store_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_store_product_id_fkey" FOREIGN KEY ("store_product_id") REFERENCES "store_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_store_product_id_fkey" FOREIGN KEY ("store_product_id") REFERENCES "store_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_product_id_fkey" FOREIGN KEY ("store_product_id") REFERENCES "store_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_replacements" ADD CONSTRAINT "order_item_replacements_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_replacements" ADD CONSTRAINT "order_item_replacements_replacement_store_product_id_fkey" FOREIGN KEY ("replacement_store_product_id") REFERENCES "store_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhooks" ADD CONSTRAINT "payment_webhooks_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_documents" ADD CONSTRAINT "financial_documents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

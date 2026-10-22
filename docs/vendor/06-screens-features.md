# Vendor — Screens & Feature Reference

> [← Back to Vendor Index](./README.md)

---

## Purpose

This document provides a screen-by-screen breakdown of all features, user interactions, validation behaviors, and backend integrations across the aasPass Vendor application.

---

## 1. Connect to Server Screen

- **Routes**: `/connect` (`vendor/app/connect.tsx` and `vendor/src/routes/connect.tsx`)
- **Access**: Accessible before signing in or via settings to configure API connectivity.

### Features
- **API URL Configuration**: Specifies the backend NestJS base URL (e.g., `http://192.168.1.100:3000` for LAN testing or production domain).
- **Supabase Credentials**: Sets `Supabase URL` and `Anon Key`.
- **Reset to Defaults**: Clears customized device values and restores `.env` defaults.
- **Persistence**: Saved to platform storage under key `aaspass.vendor.connection.v1`.

---

## 2. Sign-In & Mode Selection Screen

- **Routes**: `/` (`vendor/app/index.tsx` and `vendor/src/routes/index.tsx`)

### Features
- **Dual Authentication Modes**:
  1. **Demo Mode ("Try Sample Store")**: Instantly initializes an in-memory session without entering credentials. Populates realistic local products, inventory records, and active orders.
  2. **Live Mode ("Sign In")**: Authenticates via Supabase using email and password. On success, stores the JWT access token and navigates directly to the dashboard.
- **Connection Indicator**: Shows whether the application is pointed to a local or remote server URL with a shortcut to the Connect screen.

---

## 3. Store Profile & Management

- **Routes**: `/(tabs)/store` (`vendor/app/(tabs)/store.tsx`) & `/store` (`vendor/src/routes/store.index.tsx`)

### Features
- **Store Summary Header**: Displays store name, active status badge (`ACTIVE`, `PENDING`), verification status (`VERIFIED`), and open/closed indicator.
- **Store Information Form**:
  - Name, slug, phone, and contact email.
  - Full address fields (lines 1 & 2, city, state, country, pincode).
  - Geolocation coordinates (`latitude` and `longitude`) for hyperlocal customer distance calculations.
  - Tax and legal identifiers (`GST Number`, `Business Registration Number`).
- **Quick Links**:
  - **Operating Hours**: Opens weekly schedule editor.
  - **Delivery Settings**: Opens delivery radius and fee configuration.
  - **Connect Settings**: Quick link to modify server endpoints.
  - **Sign Out**: Clears session and redirects to login.

---

## 4. Operating Hours Editor

- **Routes**: `/store/hours` (`vendor/app/store/hours.tsx`) & `/store/hours` (`vendor/src/routes/store.hours.tsx`)

### Features
- **7-Day Schedule Matrix**: Covers Monday through Sunday.
- **Day Controls**:
  - **Closed Toggle**: Marks store closed on a given weekday.
  - **Opening Time**: Time picker (`HH:MM`) when open.
  - **Closing Time**: Time picker (`HH:MM`) when open.
- **Batch Save**: Dispatches `PUT /stores/me/hours` sending all 7 day inputs in a single payload.

---

## 5. Delivery Settings Editor

- **Routes**: `/store/delivery` (`vendor/app/store/delivery.tsx`) & `/store/delivery` (`vendor/src/routes/store.delivery.tsx`)

### Features
- **Service Availability Switches**:
  - `isDeliveryAvailable`: Enables/disables home delivery orders.
  - `isPickupAvailable`: Enables/disables store pickup orders.
- **Pricing & Thresholds**:
  - **Minimum Order Amount**: Minimum cart value required to place an order.
  - **Delivery Radius (km)**: Maximum customer distance eligible for store orders.
  - **Delivery Charge**: Base fee applied to orders.
  - **Free Delivery Above**: Cart threshold above which delivery fee is waived.
  - **Estimated Delivery Time**: Delivery duration in minutes shown to customer.
- **Update Action**: Dispatches `PATCH /stores/me/delivery-settings`.

---

## 6. Products Catalog & Inventory List

- **Routes**: `/(tabs)/products` (`vendor/app/(tabs)/products.tsx`) & `/products` (`vendor/src/routes/products.index.tsx`)

### Features
- **Product Filtering & Search**: Instant client-side search by product name, category, or SKU.
- **Stock Indicators**:
  - **In Stock**: Green badge showing current units.
  - **Low Stock**: Amber warning badge when `stockQuantity <= lowStockThreshold`.
  - **Out of Stock**: Red badge when `stockQuantity === 0`.
- **Item Pricing Details**: Displays MRP, Selling Price, and calculated discount percentage.
- **Add Product CTA**: Floating action button or header button navigating to `/products/new`.

---

## 7. Add Product (Master Catalog Onboarding)

- **Routes**: `/products/new` (`vendor/app/products/new.tsx`) & `/products/new` (`vendor/src/routes/products.new.tsx`)

### Features
- **Master Catalog Selector**: Dropdown or search picker pulling verified items from `GET /catalog/master-products`.
- **Inherited Product Metadata**: Automatically displays master brand, category, unit (e.g., 500 g, 1 kg), and veg/non-veg classification.
- **Store Pricing Inputs**:
  - **MRP**: Maximum retail price.
  - **Selling Price**: Store offering price (validated strictly: $0 < \text{sellingPrice} \le \text{MRP}$).
- **Inventory Settings**:
  - Initial stock quantity.
  - Low stock warning threshold and reorder level.
  - Featured product toggle (`isFeatured`).
- **Creation Flow**: Calls `createStoreProduct()` and initializes opening stock via `createInventory()`.

---

## 8. Product Detail & OCC Inventory Adjustment

- **Routes**: `/products/[productId]` (`vendor/app/products/[productId].tsx`) & `/products/:productId` (`vendor/src/routes/products.$productId.tsx`)

### Features
- **Price Editing**: Real-time validation preventing negative pricing or selling price exceeding MRP.
- **Stock Overview**: Shows available stock, units reserved for pending orders, and active version number.
- **Optimistic Concurrency Control (OCC) Stock Adjustment**:
  - **Transaction Type**: Select `PURCHASE`, `RESTOCK`, `RETURN` (add stock) or `SALE`, `DAMAGE`, `EXPIRED` (reduce stock).
  - **Quantity Input**: Validates positive integer and previews resulting stock balance.
  - **Version Guard**: Sends `expectedVersion` to prevent overwriting concurrent updates from other devices or customer orders.
  - **Transaction History**: Displays complete audit trail with transaction type, quantity change, resulting balance, notes, and timestamp.

---

## 9. Orders Dashboard & Order Detail

- **Routes**:
  - Queue: `/(tabs)/orders` (`vendor/app/(tabs)/orders.tsx`) & `/orders` (`vendor/src/routes/orders.index.tsx`)
  - Detail: `/orders/[orderId]` (`vendor/app/orders/[orderId].tsx`) & `/orders/:orderId` (`vendor/src/routes/orders.$orderId.tsx`)

### Queue Features
- **Status Filter Tabs**: `All`, `New` (Pending), `Packing` (Confirmed/Preparing), `Dispatched` (Out for Delivery/Ready for Pickup), `Completed`.
- **Order Summary Cards**: Displays order number, customer name, placed timestamp, fulfillment type (`DELIVERY` or `PICKUP`), total amount, and payment status (`PAID` or `COD`).

### Detail Features
- **Customer Information**: Receiver name, contact phone, full delivery address, and delivery instructions.
- **Items Breakdown**: Item name, quantity, unit price snapshot, and subtotal.
- **Bill Summary**: Subtotal, taxes, delivery fee, discounts, and grand total.
- **State Progression Actions**:
  - `Accept order` (`PENDING` → `CONFIRMED`)
  - `Reject order` (`PENDING` → `CANCELLED`)
  - `Start packing` (`CONFIRMED` → `PREPARING`)
  - `Send out for delivery` / `Ready for pickup` (`PREPARING` → `OUT_FOR_DELIVERY` / `READY_FOR_PICKUP`)
  - `Mark completed` (`OUT_FOR_DELIVERY` / `READY_FOR_PICKUP` → `DELIVERED`)
- **COD Payment Collection**: "Mark COD Paid" button updating payment status from `PENDING` to `PAID` upon delivery.

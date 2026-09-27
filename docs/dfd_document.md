# 📊 Data Flow Diagrams — aasPass System

> **System Stack:** React Native (Expo) → NestJS API → Supabase Auth + PostgreSQL (Prisma)

---

## 📋 What's Covered & What's Left

### ✅ Covered (Your Requested Flows)
| # | Flow | Notes |
|---|------|-------|
| 1 | **Sign Up** | Supabase creates user in Auth DB |
| 2 | **Sign In** | Supabase issues JWT access token |
| 3 | **Authentication / Token Verification** | NestJS guard verifies JWT on every API call |
| 4 | **User Registration (Auto-Sync)** | Auto-creates DB user on first authenticated request |
| 5 | **Add to Cart** | Validates stock, creates/updates cart & cart items |
| 6 | **Place Order** | Cart → Order with inventory deduction (atomic transaction) |
| 7 | **Order Cancellation** | Cancels order & restores inventory |

### ⚠️ Additional Flows Identified (Not Yet Requested)
| # | Flow | Why It Matters |
|---|------|----------------|
| 8 | **Wishlist Add/Remove** | Module exists in schema & server |
| 9 | **OTP Verification** | `BusinessOTP` model exists for order delivery/pickup |
| 10 | **Logout / Session Revocation** | `UserSession` model with revocation reasons |
| 11 | **Store Browse / Product Search** | Catalog module present |
| 12 | **Payment Processing** | `payments` module & `PaymentStatus` on Order |

> Let me know if you want DFDs for any of the above!

---

## 🔑 DFD Notation

```
[ External Entity ]   → Actor outside the system (User, Supabase)
( Process )           → System action / business logic
=[ Data Store ]=      → Database table or service
→ Arrow               → Data flow direction
```

---

## Level 0 — Context Diagram (Entire System)

```mermaid
flowchart LR
    U(["👤 User\n(Mobile App)"])
    SB(["🔐 Supabase\nAuth Service"])
    API(["⚙️ NestJS\nAPI Server"])
    DB(["🗄️ PostgreSQL\nPrisma DB"])

    U -- "Register / Login Credentials" --> SB
    SB -- "JWT Access Token" --> U
    U -- "API Requests + Bearer Token" --> API
    API -- "Verify Token" --> SB
    SB -- "User Identity" --> API
    API -- "Read / Write" --> DB
    DB -- "Data Response" --> API
    API -- "JSON Response" --> U
```

---

## 1️⃣ Sign Up Flow

> **Who does it:** User enters name, email/phone, password in the mobile app.  
> **Where it goes:** Directly to Supabase — the NestJS backend is NOT involved.  
> **Result:** Supabase creates the auth user; your PostgreSQL user is NOT created yet (that happens on first sign-in via auto-sync).

```mermaid
flowchart TD
    A(["👤 User\n(Mobile App)"])

    A -->|"firstName, lastName,\nemail/phone, password"| P1["1.0\nSubmit Registration Form"]
    P1 -->|"signUp request"| SB[("🔐 Supabase\nAuth DB")]
    SB -->|"User created\n+ email verification sent"| P2["1.1\nReceive Auth Response"]
    P2 -->|"Access Token + User ID"| A

    P1 -->|"Validation error\n(duplicate email/phone)"| ERR["❌ Error\nShown to User"]

    style SB fill:#f0a500,color:#000
    style ERR fill:#ff4444,color:#fff
```

**Data Stored:**
- `supabase.auth.users` → `id`, `email`, `phone`, `user_metadata.first_name`, `user_metadata.last_name`

---

## 2️⃣ Sign In Flow

> **Who does it:** Returning user enters email/phone + password.  
> **Where it goes:** Supabase validates credentials and issues JWT.  
> **Result:** Mobile app stores the access token for future API calls.

```mermaid
flowchart TD
    A(["👤 User\n(Mobile App)"])

    A -->|"email/phone + password"| P1["2.0\nSubmit Login Form"]
    P1 -->|"signInWithPassword / signInWithOTP"| SB[("🔐 Supabase\nAuth DB")]

    SB -->|"Credentials valid"| P2["2.1\nGenerate JWT Token"]
    P2 -->|"Access Token + Refresh Token"| P3["2.2\nStore Token\n(Secure Storage)"]
    P3 -->|"Login Success"| A

    SB -->|"Invalid credentials"| ERR["❌ 401 Unauthorized\nWrong email/password"]
    SB -->|"Account blocked"| BLOCKED["❌ Account Suspended"]

    style SB fill:#f0a500,color:#000
    style ERR fill:#ff4444,color:#fff
    style BLOCKED fill:#ff4444,color:#fff
```

**Data Read:**
- `supabase.auth.users` → validates password hash, account status

**Data Returned:**
- `access_token` (JWT, short-lived ~1hr)
- `refresh_token` (long-lived, stored by Expo app)

---

## 3️⃣ Authentication / Token Verification Flow

> **Every protected API call goes through this.**  
> **How it works:** NestJS has a JWT Guard that intercepts all requests, verifies the token with Supabase, then either auto-syncs a new user OR loads the existing user from PostgreSQL with roles and permissions.

```mermaid
flowchart TD
    A(["👤 User\n(Mobile App)"])

    A -->|"HTTP Request\n+ Bearer Token"| P1["3.0\nJWT Guard\n(NestJS)"]

    P1 -->|"verifyAccessToken(token)"| SB[("🔐 Supabase\nAuth")]
    SB -->|"❌ Invalid / Expired"| ERR1["401 Unauthorized"]
    SB -->|"✅ Valid → Supabase User Object"| P2["3.1\nLookup User in\nPostgreSQL by ID"]

    P2 -->|"SELECT FROM users\nWHERE id = supabase.id"| PGDB[("🗄️ PostgreSQL\nusers table")]

    PGDB -->|"User NOT found\n(first login ever)"| P3["3.2\nauto syncUser()\nCreate DB User"]
    P3 -->|"INSERT users\nwith CUSTOMER role"| PGDB

    PGDB -->|"User found"| P4["3.3\nCheck Account Status"]
    P3 -->|"New user record"| P4

    P4 -->|"status = BLOCKED"| ERR2["403 Account Blocked"]
    P4 -->|"status = ACTIVE"| P5["3.4\nLoad Role &\nPermissions"]

    P5 -->|"JOIN role_permissions\n+ permissions"| PGDB
    PGDB -->|"Role + Permission codes"| P6["3.5\nBuild CurrentUser\nContext Object"]

    P6 -->|"Inject into Request\nas CurrentUser"| CTRL["✅ Route Controller\nHandles Request"]

    style SB fill:#f0a500,color:#000
    style PGDB fill:#336699,color:#fff
    style ERR1 fill:#ff4444,color:#fff
    style ERR2 fill:#ff4444,color:#fff
```

**Data Read:**
- `supabase.auth` → verify JWT signature
- `users` → lookup by Supabase UUID
- `roles` + `role_permissions` + `permissions` → load access rights

**Data Written (only on first-ever login):**
- `users` → INSERT with `id`, `email`, `phone`, `firstName`, `lastName`, `roleId=CUSTOMER`, `status=ACTIVE`

---

## 4️⃣ User Registration (Auto-Sync) Detail

> This is a **sub-process** of Authentication (Step 3.2). Shown separately for clarity.  
> It fires **once** — on the very first authenticated request after Sign Up.

```mermaid
flowchart TD
    TRIGGER["🔑 First Protected API Call\nAfter Sign Up"]

    TRIGGER -->|"Supabase User Object"| P1["4.0\nCheck if user exists\nin PostgreSQL"]
    P1 -->|"SELECT users WHERE id = ?"| DB_USERS[("🗄️ users")]
    DB_USERS -->|"Row found → skip"| DONE["✅ User already synced"]
    DB_USERS -->|"No row → proceed"| P2["4.1\nFetch CUSTOMER Role"]

    P2 -->|"SELECT roles WHERE code='CUSTOMER'"| DB_ROLES[("🗄️ roles")]
    DB_ROLES -->|"Role not found"| ERR["500 Configuration Error"]
    DB_ROLES -->|"CUSTOMER role ID"| P3["4.2\nCreate User Record"]

    P3 -->|"INSERT INTO users\nid=supabase.id\nemail / phone\nfirstName, lastName\nstatus=ACTIVE\nroleId=CUSTOMER"| DB_USERS
    DB_USERS -->|"New user record"| DONE

    style DB_USERS fill:#336699,color:#fff
    style DB_ROLES fill:#336699,color:#fff
    style ERR fill:#ff4444,color:#fff
```

**Key Business Rule:** The Supabase UUID becomes the PostgreSQL primary key — they're always in sync.

---

## 5️⃣ Add to Cart Flow

> **User selects a product and taps "Add to Cart".**  
> **One cart per user per store** — if user already has a cart from Store A and adds from Store B, it's blocked.

```mermaid
flowchart TD
    A(["👤 Authenticated User"])

    A -->|"storeProductId, quantity"| P1["5.0\nUpsert Cart Item\n(CartService)"]

    P1 -->|"BEGIN TRANSACTION"| TXN["🔄 DB Transaction"]

    TXN -->|"SELECT store_products\nWHERE id=? AND status=AVAILABLE"| DB_SP[("🗄️ store_products")]
    DB_SP -->|"Product not found"| ERR1["❌ 404 Product Not Found"]
    DB_SP -->|"Product found"| P2["5.1\nCheck Stock\n(if trackInventory=true)"]

    P2 -->|"SELECT inventory\nstockQuantity"| DB_INV[("🗄️ inventory")]
    DB_INV -->|"quantity > stock"| ERR2["❌ 409 Insufficient Stock"]
    DB_INV -->|"Stock OK"| P3["5.2\nFind Active Cart\nfor this Store"]

    P3 -->|"SELECT carts\nWHERE userId AND storeId AND ACTIVE"| DB_CART[("🗄️ carts")]

    DB_CART -->|"Cart exists"| P5["5.4\nUpsert Cart Item"]
    DB_CART -->|"No cart yet"| P4["5.3\nCheck for Cart\nin Different Store"]
    P4 -->|"Cart from other store found"| ERR3["❌ 409 Clear cart first"]
    P4 -->|"No other cart → CREATE cart"| DB_CART

    P5 -->|"quantity = 0 → DELETE item"| P6
    P5 -->|"item exists → UPDATE quantity & price"| DB_ITEMS[("🗄️ cart_items")]
    P5 -->|"new item → INSERT cart_item\nwith name/price snapshots"| DB_ITEMS

    DB_ITEMS --> P6["5.5\nRecalculate Cart Totals\nsubtotal + tax"]

    P6 -->|"If all items removed → ABANDON cart"| DB_CART
    P6 -->|"UPDATE carts\nsubtotal, taxAmount, totalAmount"| DB_CART

    DB_CART -->|"COMMIT"| RES["✅ Return Cart Response\n(items + totals)"]
    RES --> A

    style DB_CART fill:#336699,color:#fff
    style DB_SP fill:#336699,color:#fff
    style DB_INV fill:#336699,color:#fff
    style DB_ITEMS fill:#336699,color:#fff
    style ERR1 fill:#ff4444,color:#fff
    style ERR2 fill:#ff4444,color:#fff
    style ERR3 fill:#ff4444,color:#fff
```

**Data Written:**
- `carts` → created or updated (subtotal, taxAmount, totalAmount)
- `cart_items` → upserted with price snapshots from current store product

**Key Business Rule:** Price snapshots are taken at add-to-cart time, not at checkout.

---

## 6️⃣ Place Order Flow

> **User reviews cart and taps "Place Order".**  
> **Everything is atomic** — if stock check fails midway, the whole order is rolled back.

```mermaid
flowchart TD
    A(["👤 Authenticated User"])

    A -->|"addressId, fulfillmentType\n(DELIVERY/PICKUP), notes"| P1["6.0\nCreate Order\n(OrdersService)"]

    P1 -->|"BEGIN TRANSACTION"| TXN["🔄 DB Transaction\n(Atomic)"]

    TXN -->|"SELECT carts + items\nWHERE userId & ACTIVE"| DB_CART[("🗄️ carts + cart_items")]
    DB_CART -->|"Cart empty / not found"| ERR1["❌ 400 No active cart"]

    DB_CART -->|"Cart found with items"| P2["6.1\nValidate Delivery Address\nbelongs to user"]
    P2 -->|"SELECT addresses\nWHERE id & userId"| DB_ADDR[("🗄️ addresses")]
    DB_ADDR -->|"Not found"| ERR2["❌ 404 Address not found"]

    DB_ADDR -->|"Address OK"| P3["6.2\nCheck Store Delivery Settings"]
    P3 -->|"SELECT store_delivery_settings"| DB_DS[("🗄️ store_delivery_settings")]
    DB_DS -->|"DELIVERY not available"| ERR3["❌ 400 Delivery unavailable"]
    DB_DS -->|"Below minimum order"| ERR4["❌ 400 Minimum order not met"]

    DB_DS -->|"Settings OK"| P4["6.3\nValidate All Products\nStill Available"]
    P4 -->|"SELECT store_products + inventory\nfor all cart items"| DB_SP[("🗄️ store_products")]
    DB_SP -->|"Any product unavailable"| ERR5["❌ 409 Product unavailable"]

    DB_SP -->|"All products OK"| P5["6.4\nDeduct Inventory\n(per product, with version lock)"]
    P5 -->|"UPDATE inventory\nDECREMENT stockQuantity\nINCREMENT version"| DB_INV[("🗄️ inventory")]
    DB_INV -->|"Race condition detected\n(version mismatch)"| ERR6["❌ 409 Stock changed, retry"]
    DB_INV -->|"Deducted OK"| P5A["INSERT inventory_transaction\ntype=SALE, source=ORDER_PLACEMENT"]
    P5A --> DB_INV

    DB_INV -->|"All stock deducted"| P6["6.5\nCalculate Final Totals\nsubtotal + tax + deliveryFee"]

    P6 --> P7["6.6\nGenerate Order Number\n(sequential)"]

    P7 -->|"INSERT orders\nwith address snapshot\n+ INSERT order_items\n+ INSERT status_history(PENDING)"| DB_ORD[("🗄️ orders + order_items\n+ order_status_history")]

    DB_ORD -->|"Order created"| P8["6.7\nMark Cart as CHECKED_OUT"]
    P8 -->|"UPDATE carts\nstatus=CHECKED_OUT"| DB_CART

    DB_CART -->|"COMMIT"| RES["✅ Order Response\nordering # + items + totals"]
    RES --> A

    style DB_CART fill:#336699,color:#fff
    style DB_ADDR fill:#336699,color:#fff
    style DB_DS fill:#336699,color:#fff
    style DB_SP fill:#336699,color:#fff
    style DB_INV fill:#336699,color:#fff
    style DB_ORD fill:#336699,color:#fff
    style ERR1 fill:#ff4444,color:#fff
    style ERR2 fill:#ff4444,color:#fff
    style ERR3 fill:#ff4444,color:#fff
    style ERR4 fill:#ff4444,color:#fff
    style ERR5 fill:#ff4444,color:#fff
    style ERR6 fill:#ff4444,color:#fff
    style TXN fill:#2d7a2d,color:#fff
```

**Data Written (all in one atomic transaction):**
- `orders` → new record with address snapshot, totals, `status=PENDING`
- `order_items` → one row per cart item (price snapshots copied)
- `order_status_history` → first entry: `PENDING`
- `inventory` → stock decremented + version incremented (optimistic lock)
- `inventory_transactions` → SALE transaction per product
- `carts` → status updated to `CHECKED_OUT`

---

## 7️⃣ Order Cancellation Flow

> **User taps "Cancel Order"** from order details screen.  
> **Only cancellable from:** `PENDING`, `CONFIRMED`, `PREPARING` statuses.  
> **Inventory is restored atomically** — no stock is lost.

```mermaid
flowchart TD
    A(["👤 Authenticated User"])

    A -->|"orderId, optional reason"| P1["7.0\nCancel Order\n(OrdersService)"]

    P1 -->|"BEGIN TRANSACTION"| TXN["🔄 DB Transaction\n(Atomic)"]

    TXN -->|"SELECT orders + items + inventory\nWHERE id & userId"| DB_ORD[("🗄️ orders + order_items")]
    DB_ORD -->|"Order not found"| ERR1["❌ 404 Order not found"]

    DB_ORD -->|"Order found"| P2["7.1\nCheck Cancellable Status\nPENDING / CONFIRMED / PREPARING"]
    P2 -->|"Status is OUT_FOR_DELIVERY\nor DELIVERED"| ERR2["❌ 409 Cannot cancel\nat this stage"]

    P2 -->|"Status is cancellable"| P3["7.2\nRestore Inventory\n(per ordered item)"]

    P3 -->|"For each item that tracks inventory:"| LOOP["🔁 Loop over order_items"]
    LOOP -->|"UPDATE inventory\nINCREMENT stockQuantity\nINCREMENT version"| DB_INV[("🗄️ inventory")]
    DB_INV -->|"version mismatch"| ERR3["❌ 409 Inventory conflict\n— retry"]
    DB_INV -->|"Restored OK"| P3A["INSERT inventory_transaction\ntype=RETURN\nsource=ORDER_CANCELLATION"]
    P3A -->|"Next item"| LOOP

    LOOP -->|"All items restored"| P4["7.3\nUpdate Order Status\nto CANCELLED"]
    P4 -->|"UPDATE orders\nstatus=CANCELLED\ncancelledAt=now()"| DB_ORD

    P4 -->|"INSERT order_status_history\npreviousStatus → CANCELLED"| DB_HIST[("🗄️ order_status_history")]

    DB_HIST -->|"COMMIT"| RES["✅ Cancelled Order Response"]
    RES --> A

    style DB_ORD fill:#336699,color:#fff
    style DB_INV fill:#336699,color:#fff
    style DB_HIST fill:#336699,color:#fff
    style ERR1 fill:#ff4444,color:#fff
    style ERR2 fill:#ff4444,color:#fff
    style ERR3 fill:#ff4444,color:#fff
    style TXN fill:#2d7a2d,color:#fff
```

**Data Updated (all atomic):**
- `orders` → `status=CANCELLED`, `cancelledAt=now()`
- `order_status_history` → new entry with previous → CANCELLED
- `inventory` → `stockQuantity` restored per item
- `inventory_transactions` → RETURN transaction per product

---

## 🗂️ Summary Table — Data Stores Involved

| Flow | Tables Touched |
|------|---------------|
| Sign Up | `supabase.auth.users` |
| Sign In | `supabase.auth.users` |
| Auth Verify | `users`, `roles`, `role_permissions`, `permissions` |
| User Sync | `users`, `roles` |
| Add to Cart | `store_products`, `inventory`, `carts`, `cart_items` |
| Place Order | `carts`, `cart_items`, `addresses`, `store_delivery_settings`, `store_products`, `inventory`, `inventory_transactions`, `orders`, `order_items`, `order_status_history` |
| Cancel Order | `orders`, `order_items`, `inventory`, `inventory_transactions`, `order_status_history` |

---

## 🏗️ How I Created These DFDs

1. **Explored your codebase** — read `schema.prisma`, `auth.service.ts`, `cart.service.ts`, `orders.service.ts`
2. **Traced real code paths** — every arrow in these diagrams maps to actual code lines
3. **Identified all data stores** — matched Prisma models to DFD data stores
4. **Captured error paths** — included all `throw` statements from services
5. **Noted atomic transactions** — highlighted `$transaction()` blocks in green

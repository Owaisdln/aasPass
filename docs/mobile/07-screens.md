# Mobile — Screens

> [← Back to Mobile Index](./README.md)

---

## Purpose

Each screen is a full-page React Native component in `src/screens/`. Screens read from `useAppStore` and call store actions; they do not call API functions directly. Screens are thin — business logic lives in the store or pure helpers.

---

## Screen Reference

### 1. `HomeScreen` (`HomeScreen.tsx`)

**Route:** `/` (tab index)

The main discovery screen. Displays:
- A location/greeting header
- Featured store banners (horizontal scroll)
- Category filter chips
- Store listings filtered by selected category
- A `FloatingCartBar` overlay when the cart is non-empty

**Key actions:**
- Tap store card → navigate to `/store/:storeId`
- Tap category chip → filter stores/products
- Tap cart bar → navigate to `/cart`

---

### 2. `SearchScreen` (`SearchScreen.tsx`)

**Route:** `/search` (tab)

Full-text product search. Filters the product catalogue by query string in real time. Displays matching `ProductCard` components.

**Key actions:**
- Type in search box → live filter products
- Tap product card → navigate to `/product/:productId`

---

### 3. `OrdersScreen` (`OrdersScreen.tsx`)

**Route:** `/orders` (tab)

Displays the user's order history as a list. Each row shows the order number, store name, status badge, and total.

**Key actions:**
- Tap order row → navigate to `/order/:orderId`
- Pull to refresh → `syncOrders()`

---

### 4. `WishlistScreen` (`WishlistScreen.tsx`)

**Route:** `/wishlist` (tab)

Displays all products in the user's default wishlist. Empty state prompts the user to browse stores.

**Key actions:**
- Tap product → navigate to `/product/:productId`
- Toggle heart icon → `toggleWishlist(productId)`

---

### 5. `AccountScreen` (`AccountScreen.tsx`)

**Route:** `/account` (tab)

User profile and settings screen. Sections include:
- Display name (editable inline)
- Email and phone (read-only)
- Address management (list, add, delete)
- Active sessions shortcut → `/sessions`
- Backend connection settings → `/connection`
- Sign out button

**Key actions:**
- Edit name → `updateName()` + `PATCH /users/me`
- Add address → `addAddress()`
- Delete address → `deleteAddress()`
- Tap sessions → navigate to `/sessions`
- Sign out → `signOut()`

---

### 6. `StoreDetailScreen` (`StoreDetailScreen.tsx`)

**Route:** `/store/:storeId`

Shows a single store's details and its full product catalogue.

Displays:
- Store header (name, rating, delivery info, open/closed status)
- Product grid with `ProductCard` components
- `FloatingCartBar` overlay

**Key actions:**
- Tap product → navigate to `/product/:productId`
- Tap add-to-cart → `addToCart(productId)`
- Tap cart bar → navigate to `/cart`

---

### 7. `ProductDetailScreen` (`ProductDetailScreen.tsx`)

**Route:** `/product/:productId`

Full product detail view with image, brand, description, MRP vs. price comparison, stock label, and quantity selector.

**Key actions:**
- Change quantity → `setQuantity()`
- Add to cart → `addToCart(productId)`
- Wishlist toggle → `toggleWishlist(productId)`

---

### 8. `CartScreen` (`CartScreen.tsx`)

**Route:** `/cart`

Cart review screen. Displays all cart lines with `QuantityControl` components, a `CartSummary` total breakdown, and a proceed-to-checkout button.

**Key actions:**
- Adjust quantity → `setQuantity()`
- Remove item → `setQuantity(productId, 0)`
- Proceed to checkout → navigate to `/checkout`

---

### 9. `CheckoutScreen` (`CheckoutScreen.tsx`)

**Route:** `/checkout`

Multi-step order placement screen.

Steps:
1. **Delivery address** — select from saved addresses or add new
2. **Fulfilment** — choose delivery or pickup
3. **Delivery instructions** — optional text input
4. **Payment method** — COD or Razorpay online (via `Payment` component)
5. **Place order** → `placeOrder(fulfilment, instructions)` → navigate to `/order/:orderId`

---

### 10. `OrderDetailScreen` (`OrderDetailScreen.tsx`)

**Route:** `/order/:orderId`

Full order detail view. Displays:
- Order header (number, status badge, placed date)
- Line items with price snapshots
- Address and fulfilment details
- Payment record (method, status)
- Item replacement requests (accept/reject controls)
- Order cancellation button (if `isOrderCancellable`)
- Invoice download button (generates PDF via `src/utils/invoice.ts`)

**Key actions:**
- Cancel order → `cancelOrder(orderId)`
- Accept/reject replacement → `respondToReplacement()`
- Download invoice → generate PDF + `expo-sharing`

---

### 11. `SignInScreen` (`SignInScreen.tsx`)

**Route:** `/sign-in`

Authentication screen supporting multiple sign-in flows:

| Flow | Description |
|---|---|
| Email + Password | `signInWithPassword(email, password)` |
| Email OTP | `sendEmailOtp(email)` → `verifyEmailOtp(email, token)` |
| Phone OTP | `sendPhoneOtp(phone)` → `verifyPhoneOtp(phone, token)` |
| Demo user | `listDemoUsers()` → `signInDemoUser(email)` (dev only) |

After successful sign-in → `store.signIn(accessToken)` → navigate to `/`.

---

### 12. `SessionsScreen` (`SessionsScreen.tsx`)

**Route:** `/sessions`

Displays all active device sessions fetched from `GET /users/me/sessions`. Each session shows the device name, platform, location, and last-active time. The current session is marked.

**Key actions:**
- Revoke a session → `DELETE /users/me/sessions/:sessionId` + `revokeSession()`
- Revoke all other sessions → `DELETE /users/me/sessions` + `revokeOtherSessions()`

---

### 13. `ConnectionScreen` (`ConnectionScreen.tsx`)

**Route:** `/connection`

Developer/setup screen for configuring the backend connection. Allows the user to enter:

| Field | Description |
|---|---|
| API URL | NestJS backend URL (e.g., `http://192.168.1.5:3000`) |
| Supabase URL | Supabase project URL |
| Supabase Anon Key | Public anon key |

**Key actions:**
- Save settings → `saveConnection(config)` + `resetSupabase()`
- Test connection → `GET /` health check

> This screen exists because physical devices must use the computer's LAN IP, not `localhost`.

---

*End of Screens*

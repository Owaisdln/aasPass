# Mobile — Navigation & Routing

> [← Back to Mobile Index](./README.md)

---

## Purpose

The mobile app uses **Expo Router** (file-system routing) for navigation. Route files live in the `app/` directory and map directly to URL paths. Dynamic segments use `[param]` folder/file naming.

---

## 1. Route Structure

```
app/
├── _layout.tsx              ← Root stack navigator (all screens)
├── (tabs)/
│   ├── _layout.tsx          ← Bottom tab navigator
│   ├── index.tsx            ← /          → HomeScreen
│   ├── search.tsx           ← /search    → SearchScreen
│   ├── orders.tsx           ← /orders    → OrdersScreen
│   ├── wishlist.tsx         ← /wishlist  → WishlistScreen
│   └── account.tsx          ← /account   → AccountScreen
├── store/
│   └── [storeId].tsx        ← /store/:storeId  → StoreDetailScreen
├── product/
│   └── [productId].tsx      ← /product/:productId → ProductDetailScreen
├── order/
│   └── [orderId].tsx        ← /order/:orderId  → OrderDetailScreen
├── cart.tsx                 ← /cart      → CartScreen
├── checkout.tsx             ← /checkout  → CheckoutScreen
├── sign-in.tsx              ← /sign-in   → SignInScreen
├── sessions.tsx             ← /sessions  → SessionsScreen
└── connection.tsx           ← /connection → ConnectionScreen
```

---

## 2. Tab Navigator (`app/(tabs)/_layout.tsx`)

The bottom tab bar contains five tabs. All tab screens use `headerShown: false`.

| Tab | Route | Screen | Icon |
|---|---|---|---|
| **Home** | `/` (index) | `HomeScreen` | Home icon |
| **Search** | `/search` | `SearchScreen` | Search icon |
| **Orders** | `/orders` | `OrdersScreen` | Package icon |
| **Wishlist** | `/wishlist` | `WishlistScreen` | Heart icon |
| **Account** | `/account` | `AccountScreen` | User icon |

---

## 3. Screen Hierarchy

| Screen | File | Entry Route | Purpose |
|---|---|---|---|
| `HomeScreen` | `src/screens/HomeScreen.tsx` | `/` | Store listings, featured stores, product browsing |
| `SearchScreen` | `src/screens/SearchScreen.tsx` | `/search` | Product search with live filtering |
| `OrdersScreen` | `src/screens/OrdersScreen.tsx` | `/orders` | Order history list |
| `WishlistScreen` | `src/screens/WishlistScreen.tsx` | `/wishlist` | Saved wishlist items |
| `AccountScreen` | `src/screens/AccountScreen.tsx` | `/account` | User profile, address management, sign-out |
| `StoreDetailScreen` | `src/screens/StoreDetailScreen.tsx` | `/store/:storeId` | Store info, product listings for one store |
| `ProductDetailScreen` | `src/screens/ProductDetailScreen.tsx` | `/product/:productId` | Product image, details, add-to-cart |
| `OrderDetailScreen` | `src/screens/OrderDetailScreen.tsx` | `/order/:orderId` | Full order view, status tracking, invoice |
| `CartScreen` | `src/screens/CartScreen.tsx` | `/cart` | Cart review, quantity controls, proceed to checkout |
| `CheckoutScreen` | `src/screens/CheckoutScreen.tsx` | `/checkout` | Address selection, payment method, order placement |
| `SignInScreen` | `src/screens/SignInScreen.tsx` | `/sign-in` | Email/password, OTP, and demo user authentication |
| `SessionsScreen` | `src/screens/SessionsScreen.tsx` | `/sessions` | View and revoke active device sessions |
| `ConnectionScreen` | `src/screens/ConnectionScreen.tsx` | `/connection` | Configure backend API URL and Supabase credentials |

---

## 4. Navigation Patterns

### Programmatic Navigation

All navigation uses `expo-router` hooks:

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';

const router = useRouter();

// Navigate to a screen
router.push('/cart');
router.push(`/product/${productId}`);
router.push(`/order/${orderId}`);

// Go back
router.back();
```

### Floating Cart Bar

A `FloatingCartBar` component is rendered as an overlay on the `HomeScreen` and `StoreDetailScreen`. It shows the current cart item count and total, and navigates to `/cart` on tap.

---

*End of Navigation & Routing*

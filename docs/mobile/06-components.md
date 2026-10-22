# Mobile — Components

> [← Back to Mobile Index](./README.md)

---

## Purpose

`src/components/` contains shared, reusable UI components used across multiple screens. Each component is focused on a single presentational or interaction concern.

---

## Component Reference

### `CartSummary` (`CartSummary.tsx`)

Displays a full breakdown of cart totals: subtotal, delivery fee, discount, and grand total. Used on the `CartScreen` and `CheckoutScreen`.

| Prop | Type | Description |
|---|---|---|
| `subtotal` | `number` | Subtotal before fees |
| `deliveryFee` | `number` | Delivery fee (₹) |
| `discount` | `number?` | Discount applied (₹) |

---

### `FloatingCartBar` (`FloatingCartBar.tsx`)

A fixed-position overlay bar that shows the current cart item count and total. Navigates to `/cart` on tap. Displayed on `HomeScreen` and `StoreDetailScreen` when the cart is non-empty.

| Prop | Type | Description |
|---|---|---|
| `itemCount` | `number` | Total items in cart |
| `total` | `number` | Cart grand total (₹) |

---

### `LocationPicker` (`LocationPicker.tsx`)

An address search/selection sheet. Allows users to search for and pin a delivery address on a map or from saved addresses.

---

### `Payment` (`Payment.tsx`)

Renders the payment method selection UI (COD vs. Razorpay online) and the payment confirmation button. Used on `CheckoutScreen`.

| Prop | Type | Description |
|---|---|---|
| `orderId` | `string` | The order to pay for |
| `total` | `number` | Payment amount |
| `onSuccess` | `() => void` | Callback on payment completion |

---

### `Primitives` (`Primitives.tsx`)

A collection of small, reusable layout and typography primitives used throughout the app. Includes:

| Primitive | Description |
|---|---|
| `Row` | Horizontal flexbox row |
| `Column` | Vertical flexbox column |
| `Spacer` | Flexible spacer |
| `Divider` | Horizontal divider line |
| `Badge` | Small labelled badge |
| `Pill` | Rounded pill chip |
| `Heading` | Styled heading text |
| `Body` | Styled body text |
| `Muted` | Styled muted/secondary text |

---

### `ProductCard` (`ProductCard.tsx`)

Renders a single product in a grid or list layout. Shows the product image, name, brand, price, MRP (with strikethrough), stock status badge, and an add-to-cart button.

| Prop | Type | Description |
|---|---|---|
| `product` | `Product` | The product to display |
| `onPress` | `() => void` | Called when the card is tapped |
| `onAddToCart` | `() => void` | Called when the add-to-cart button is tapped |

---

### `QuantityControl` (`QuantityControl.tsx`)

An increment/decrement quantity selector used in the cart and product detail screens. Enforces the `MAX_PRODUCT_QUANTITY` (5) and stock limits.

| Prop | Type | Description |
|---|---|---|
| `productId` | `string` | Product being adjusted |
| `quantity` | `number` | Current quantity |
| `maxQuantity` | `number` | Maximum allowed quantity |
| `onChange` | `(qty: number) => void` | Called on quantity change |

---

### `RepeatOrderCard` (`RepeatOrderCard.tsx`)

A compact card for displaying a past order for quick repeat. Shows the order summary and a "Repeat Order" button.

| Prop | Type | Description |
|---|---|---|
| `order` | `DemoOrder` | The order to display |
| `onRepeat` | `() => void` | Called when "Repeat Order" is tapped |

---

### `ScreenHeader` (`ScreenHeader.tsx`)

A consistent header bar used at the top of non-tab screens. Shows a back button, title, and an optional right action.

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Screen title |
| `onBack` | `() => void` | Called when the back button is tapped |
| `rightAction` | `ReactNode?` | Optional right-side action element |

---

### `StockLabel` (`StockLabel.tsx`)

A small inline label showing stock availability. Renders `"In stock"`, `"Only N left"`, or `"Out of stock"` with appropriate colour coding.

| Prop | Type | Description |
|---|---|---|
| `product` | `Product` | The product to show stock for |

---

### `StoreCards` (`StoreCards.tsx`)

Renders a horizontal or vertical list of store cards. Each card shows the store name, delivery fee, rating, distance, and open/closed status.

| Prop | Type | Description |
|---|---|---|
| `stores` | `Store[]` | List of stores to display |
| `onPress` | `(storeId: string) => void` | Called when a store card is tapped |

---

*End of Components*

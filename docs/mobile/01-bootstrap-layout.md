# Mobile — App Bootstrap & Layout

> [← Back to Mobile Index](./README.md)

---

## Purpose

`app/_layout.tsx` is the root layout component for the Expo Router app. It wraps the entire app in global providers, runs the startup bootstrap, displays a custom branded splash screen, and configures the navigation stack.

---

## 1. Root Layout (`app/_layout.tsx`)

### Global Providers (Outermost to Innermost)

| Provider | Purpose |
|---|---|
| `SafeAreaProvider` | Provides safe area insets for notched devices |
| `QueryClientProvider` | Provides the TanStack React Query client |
| `StatusBar` | Configures the OS status bar (dark style) |

### QueryClient Configuration

```
new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 300_000,   ← 5 minutes
    },
  },
})
```

### Startup Sequence (`useEffect`)

```
On mount:
 1. useAppStore.getState().bootstrap()     ← Restore backend connection + Supabase session
 2. subscribeToCatalogUpdates(callback)    ← Subscribe to Socket.io catalog events
    → On 'catalog:update' event:
       - queryClient.invalidateQueries(['stores'])
       - queryClient.invalidateQueries(['products'])
 3. Animate splash screen (spring scale + fade-in text)
 4. setTimeout(1100ms) → fade out splash → setSplashFinished(true)

On unmount:
 - stopCatalogUpdates()   ← Unsubscribe from Socket.io
 - clearTimeout(timer)    ← Cancel pending splash timer
```

### Navigation Stack

The stack uses `slide_from_right` animation and a `colors.background` content background.

| Screen Name | Route | Header |
|---|---|---|
| `(tabs)` | `/` | Hidden |
| `store/[storeId]` | `/store/:storeId` | Hidden |
| `product/[productId]` | `/product/:productId` | Hidden |
| `order/[orderId]` | `/order/:orderId` | Hidden |
| `cart` | `/cart` | Hidden |
| `checkout` | `/checkout` | Hidden |
| `sessions` | `/sessions` | Hidden |
| `connection` | `/connection` | Hidden |
| `sign-in` | `/sign-in` | Hidden |

### Splash Screen

A custom branded splash overlay (`zIndex: 9999`) is rendered on top of the stack until `splashFinished` is true. It shows:

- Spring-animated logo mark (scale `0.92 → 1`)
- Fade-in brand name: `aas` (primary colour) + `Pass` (offer colour)
- Tagline: *"Sab Kuch Milega, AasPass"*
- Fade-out animation (350ms opacity `1 → 0`) after 1100ms

---

## 2. Font Loading

Four Nunito Sans weights are loaded via `useFonts` from `@expo-google-fonts/nunito-sans`:

| Weight | Token |
|---|---|
| 400 Regular | `NunitoSans_400Regular` |
| 600 SemiBold | `NunitoSans_600SemiBold` |
| 700 Bold | `NunitoSans_700Bold` |
| 800 ExtraBold | `NunitoSans_800ExtraBold` |

---

## 3. `bootstrap()` — Store Startup Action

Defined in `src/store.ts`. Called once on app mount. Performs:

```
bootstrap():
 1. initConnection()        ← Load stored API URL + Supabase keys from SecureStore
 2. restoreSession()        ← Re-hydrate Supabase session from AsyncStorage
 3. setApiAccessToken(token) ← Inject token into apiFetch headers
 4. signIn(accessToken)     ← Load user profile + sync cart/orders/wishlist from backend
```

If the backend is not configured (no API URL set) or no session is found, the app starts in an unauthenticated local-only state without blocking the UI.

---

*End of App Bootstrap & Layout*

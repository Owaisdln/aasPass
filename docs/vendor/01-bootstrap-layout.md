# Vendor — Bootstrap & Layout

> [← Back to Vendor Index](./README.md)

---

## Purpose

This document covers the startup sequence, root layout configuration, providers, and layout styling across both the native/mobile app (`vendor/app/`) and the web application (`vendor/src/routes/`).

---

## Universal Providers & Entry Architecture

The vendor application initializes a unified provider hierarchy to ensure both native screens and web pages have access to:
1. **QueryClientProvider**: TanStack React Query cache instance.
2. **Session Store Rehydration**: Loading persisted credentials from `SecureStore` (native) or `AsyncStorage` (web).
3. **Route Protection & Redirection**: Enforcing authentication state before entering vendor dashboards.

### 1. Native / Expo Entry (`vendor/app/_layout.tsx`)

In the Expo Router setup, `vendor/app/_layout.tsx` serves as the root boundary:

```tsx
export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const { session, hydrated } = useSession();
  const segments = useSegments();

  // Hydrate session on initial mount
  useEffect(() => {
    useSession.persist.rehydrate();
  }, []);

  // Auth gatekeeper
  useEffect(() => {
    if (!hydrated) return;
    const inTabs = segments[0] === "(tabs)";
    if (!session && inTabs) {
      router.replace("/");
    } else if (session && !inTabs && segments[0] !== "connect") {
      router.replace("/(tabs)/orders");
    }
  }, [hydrated, session, segments]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
```

#### Startup Sequence Flow
1. **App Mounts**: `QueryClient` is instantiated in component state.
2. **Rehydration**: `useSession.persist.rehydrate()` is triggered to pull `aaspass.vendor.session.v1` from the platform storage.
3. **Guard Check**:
   - If not authenticated and attempting to view `(tabs)/*`, redirected to `/` (Sign In).
   - If authenticated and on `/`, redirected to `/(tabs)/orders` (Primary Vendor Dashboard).
   - If visiting `/connect`, bypasses redirect to allow manual backend configuration.

---

### 2. Web / TanStack Start Entry (`vendor/src/routes/__root.tsx`)

In TanStack Start, `src/routes/__root.tsx` serves as the root shell wrapping every web page:

```tsx
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
});

function RootComponent() {
  const { session, hydrated } = useSession();
  const router = useRouter();

  useEffect(() => {
    useSession.persist.rehydrate();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F8F5] text-[#17211B]">
      <header className="border-b border-[#E1E8E3] bg-white">
        {/* Navigation bar with tab links and active store indicator */}
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
```

---

## Design System & Theme Tokens

The vendor app implements a cohesive design system centered on high-contrast accessibility and clean typography:

### Color Palette

Both targets share identical design tokens:

| Token | Hex | Role | Usage |
|---|---|---|---|
| `primary` | `#2F855A` | Brand Green | Primary buttons, active tabs, success indicators |
| `primaryDark` | `#276749` | Deep Green | Button hover/pressed states, headers |
| `soft` | `#E8F4EC` | Light Mint | Pill backgrounds, active badge tints |
| `ink` | `#17211B` | Charcoal Black | Main body text, headings |
| `muted` | `#68766D` | Slate Gray | Subtitles, labels, disabled text, icons |
| `border` | `#E1E8E3` | Light Border | Card outlines, divider lines, table borders |
| `surface` | `#FFFFFF` | Pure White | Card backgrounds, input surfaces, header bars |
| `background` | `#F5F8F5` | Off-white Gray | Full page viewport backgrounds |
| `warning` | `#B45309` | Amber Brown | Low-stock badges, pending status alerts |
| `warningSoft` | `#FFF4D6` | Pale Yellow | Warning badge backgrounds |
| `danger` | `#B42318` | Dark Red | Delete actions, stock errors, cancelled badges |
| `dangerSoft` | `#FEECEB` | Pale Red | Danger badge backgrounds |

---

## Native UI Primitives (`vendor/src/native/ui.tsx`)

To maintain clean code in Expo screens, custom styled components are implemented in `vendor/src/native/ui.tsx`:

- **`<Screen>`**: Viewport wrapper that manages keyboard-aware `ScrollView` or fixed flex containers.
- **`<TopBar>`**: Standardized navigation bar with optional back button (`ChevronLeft`), title, subtitle, and action buttons.
- **`<Card>`**: Contained surface with border and subtle background separation for content groupings.
- **`<SectionHeader>`**: Title and action row for separating logical sections within a screen.
- **`<Field>` / `<Input>`**: Accessible label, text input, and validation error message container.
- **`<PrimaryButton>` / `<SecondaryButton>` / `<GhostButton>`**: Standardized CTA buttons with loading spinners.
- **`<Badge>`**: Colored status pills for order and inventory states (`NEW`, `PREPARING`, `LOW STOCK`, etc.).
- **`<EmptyState>`**: Centered placeholder illustration with call-to-action button when lists are empty.

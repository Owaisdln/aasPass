// ---------------------------------------------------------------------------
// App state (zustand) for aasPass mobile app.
// ---------------------------------------------------------------------------

import { create } from "zustand";
import { isBackendConfigured, setApiAccessToken } from "./api/client";
import { addWishlistItem, getOrCreateDefaultWishlist, removeWishlistItem } from "./api/wishlist";
import { createPaymentForOrder } from "./api/payments";
import { initConnection } from "./api/config";
import { signOutRemote } from "./api/auth";
import { getMe, listMySessions, revokeMySession, updateMe } from "./api/users";
import { cancelOrder as cancelOrderApi, createOrder as createOrderApi, listOrders } from "./api/orders";
import { clearCart as clearCartApi, getMyCart, upsertCartItem } from "./api/carts";
import { createAddress as createAddressApi, deleteAddress as deleteAddressApi, listAddresses as listAddressesApi } from "./api/addresses";
import { mapOrder, mapSession } from "./api/mappers";
import { getProduct, stores } from "./data";
import { getStockStatus, isOrderCancellable, type Address, type CartLine, type DemoOrder, type Session } from "./model";

export type AddToCartResult = "added" | "conflict" | "stock-limit" | "unavailable";

type AppState = {
  // cart
  cart: CartLine[];
  cartStoreId: string | null;
  addToCart: (productId: string, forceSwitch?: boolean) => Promise<AddToCartResult>;
  setQuantity: (productId: string, quantity: number) => void;

  // orders
  orders: DemoOrder[];
  placeOrder: (fulfilment: "delivery" | "pickup", deliveryInstructions?: string) => Promise<string | null>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  repeatOrder: (orderId: string) => "added" | "unavailable";
  respondToReplacement: (orderId: string, replacementId: string, accept: boolean) => void;
  storeFeedback: Record<string, { rating: number; tags: string[]; comment: string }>;
  submitStoreFeedback: (orderId: string, rating: number, tags: string[], comment: string) => void;
  addOrderNote: (orderId: string, note: string) => void;

  // browsing
  wishlist: string[];
  wishlistItemIds: Record<string, string>;
  wishlistId: string | null;
  wishlistSync: "local" | "syncing" | "synced" | "error";
  toggleWishlist: (productId: string) => void;
  syncWishlist: () => Promise<void>;
  recentlyViewed: string[];
  markViewed: (productId: string) => void;

  // account
  firstName: string;
  lastName: string;
  updateName: (firstName: string, lastName: string) => void;
  addressId: string;
  addresses: Address[];
  setAddressId: (addressId: string) => void;
  addAddress: (address: Omit<Address, "id"> & { receiverName: string; receiverPhone: string; country: string }) => Promise<string>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  email: string;
  phone: string;
  sessions: Session[];
  revokeSession: (sessionId: string) => boolean;
  revokeOtherSessions: () => number;
  isSignedIn: boolean;
  signIn: (accessToken?: string) => Promise<void>;
  signOut: () => void;

  // live backend sync
  sync: Record<SyncArea, SyncStatus>;
  bootstrap: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  syncProfile: () => Promise<void>;
  syncAddresses: () => Promise<void>;
  syncCart: () => Promise<void>;
  syncSessions: () => Promise<void>;
  syncOrders: () => Promise<void>;
};

export type SyncArea = "profile" | "sessions" | "orders" | "wishlist";
export type SyncStatus = "local" | "syncing" | "synced" | "error";

export const useAppStore = create<AppState>((set, get) => ({
  // --- cart ---------------------------------------------------------------
  cart: [],
  cartStoreId: null,
  addToCart: async (productId, forceSwitch = false) => {
    const product = getProduct(productId);
    const stock = getStockStatus(product);
    if (!product || !stock.available) return "unavailable";
    const state = get();
    const isSwitchingStore = Boolean(state.cartStoreId && state.cartStoreId !== product.storeId);
    if (isSwitchingStore && !forceSwitch) return "conflict";
    if (isSwitchingStore && isBackendConfigured() && state.isSignedIn) {
      await clearCartApi();
    }
    const existing = isSwitchingStore ? undefined : state.cart.find((line) => line.productId === productId);
    if (existing && existing.quantity >= stock.quantity) return "stock-limit";
    const nextQty = existing ? existing.quantity + 1 : 1;
    set((current) => ({
      cartStoreId: product.storeId,
      cart: existing
        ? current.cart.map((line) => line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line)
        : [...(isSwitchingStore ? [] : current.cart), { productId, quantity: 1 }],
    }));
    if (isBackendConfigured() && get().isSignedIn) {
      try {
        await upsertCartItem(productId, nextQty);
      } catch (error) {
        if (isSwitchingStore) {
          set({ cart: [], cartStoreId: null });
          throw error;
        }
        set((current) => {
          const currentLine = current.cart.find((line) => line.productId === productId);
          if (current.cartStoreId !== product.storeId || currentLine?.quantity !== nextQty) {
            return {};
          }

          return { cart: state.cart, cartStoreId: state.cartStoreId };
        });
        throw error;
      }
    }
    return "added";
  },
  setQuantity: (productId, quantity) => {
    const available = getStockStatus(getProduct(productId)).quantity;
    const capped = Math.min(quantity, available);
    set((state) => {
      const cart = capped <= 0
        ? state.cart.filter((line) => line.productId !== productId)
        : state.cart.map((line) => line.productId === productId ? { ...line, quantity: capped } : line);
      return { cart, cartStoreId: cart.length ? state.cartStoreId : null };
    });
    if (isBackendConfigured() && get().isSignedIn) {
      void upsertCartItem(productId, Math.max(0, capped)).catch(() => {});
    }
  },

  // --- orders -------------------------------------------------------------
  orders: [],
  storeFeedback: {},
  placeOrder: async (fulfilment, deliveryInstructions) => {
    const state = get();
    if (!state.cart.length || !state.cartStoreId) return null;
    if (!isBackendConfigured() || !state.isSignedIn) {
      throw new Error("Connect to the server and sign in before placing an order.");
    }

    const liveAddresses = await listAddressesApi();
    const selectedAddress = liveAddresses.find((address) => address.id === state.addressId)
      ?? liveAddresses.find((address) => address.isDefault)
      ?? liveAddresses[0];
    if (!selectedAddress) {
      throw new Error("Add a saved delivery address before placing your order.");
    }
    if (selectedAddress.id !== state.addressId) {
      set({ addressId: selectedAddress.id });
    }

    for (const line of state.cart) {
      await upsertCartItem(line.productId, line.quantity);
    }

    const fulfillmentType = fulfilment === "pickup" ? "PICKUP" : "DELIVERY";
    const backendOrder = await createOrderApi({
      addressId: selectedAddress.id,
      fulfillmentType,
      notes: deliveryInstructions,
    });

    const liveOrder: DemoOrder = {
      id: backendOrder.orderNumber || backendOrder.id,
      serverId: backendOrder.id,
      orderNumber: backendOrder.orderNumber,
      storeId: backendOrder.storeId || state.cartStoreId,
      items: state.cart,
      lines: backendOrder.items.map((item) => ({
        name: item.productNameSnapshot,
        unit: item.unitSnapshot,
        quantity: item.quantity,
        price: Number(item.sellingPriceSnapshot),
      })),
      total: Number(backendOrder.totalAmount),
      status: "PENDING",
      placedAt: backendOrder.placedAt || new Date().toISOString(),
      fulfilment,
      deliveryInstructions,
      payment: { method: "COD", status: "PENDING" },
      replacements: [],
    };

    set({
      cart: [],
      cartStoreId: null,
      orders: [liveOrder, ...state.orders],
    });

    void createPaymentForOrder(backendOrder.id, "COD").catch(() => {});
    void clearCartApi().catch(() => {});
    void get().syncOrders().catch(() => {});

    return liveOrder.id;
  },
  cancelOrder: async (orderId) => {
    const order = get().orders.find((item) => item.id === orderId);
    if (!order || !isOrderCancellable(order.status)) return false;

    if (order.serverId) {
      if (!isBackendConfigured()) {
        throw new Error("Sign in and connect to the server before cancelling this order.");
      }
      await cancelOrderApi(order.serverId, "Cancelled by customer");
    }

    set((state) => ({
      orders: state.orders.map((o) => o.id === orderId && isOrderCancellable(o.status)
        ? {
          ...o,
          status: "CANCELLED",
          statusLabel: "Cancelled",
          replacements: o.replacements.map((item) => item.status === "PENDING" ? { ...item, status: "CANCELLED" as const } : item),
        }
        : o),
    }));
    if (order.serverId) void get().syncOrders().catch(() => {});
    return true;
  },
  repeatOrder: (orderId) => {
    const state = get();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return "unavailable";
    const items = order.items
      .map((line) => ({ ...line, quantity: Math.min(line.quantity, getStockStatus(getProduct(line.productId)).quantity) }))
      .filter((line) => line.quantity > 0);
    if (!items.length) return "unavailable";
    set({ cart: items, cartStoreId: order.storeId });
    return "added";
  },
  respondToReplacement: (orderId, replacementId, accept) => set((state) => ({
    orders: state.orders.map((order) => {
      if (order.id !== orderId) return order;
      const replacement = order.replacements.find((item) => item.id === replacementId && item.status === "PENDING");
      if (!replacement) return order;
      const respondedAt = new Date().toISOString();
      const originalPrice = getProduct(replacement.originalProductId)?.price ?? 0;
      const items = accept
        ? order.items.map((line) => line.productId === replacement.originalProductId ? { ...line, productId: replacement.replacementProductId } : line)
        : order.items.filter((line) => line.productId !== replacement.originalProductId);
      const total = accept
        ? order.total + (replacement.replacementPriceSnapshot - originalPrice) * replacement.quantity
        : order.total - originalPrice * replacement.quantity;
      return {
        ...order,
        items,
        total: Math.max(total, 0),
        replacements: order.replacements.map((item) => item.id === replacementId
          ? {
            ...item,
            status: accept ? ("ACCEPTED" as const) : ("REJECTED" as const),
            respondedAt,
            customerResponse: accept ? "Accepted the suggested replacement" : "Declined — refund this item",
          }
          : item),
      };
    }),
  })),
  submitStoreFeedback: (orderId, rating, tags, comment) => set((state) => ({
    storeFeedback: { ...state.storeFeedback, [orderId]: { rating, tags, comment } },
  })),
  addOrderNote: (orderId, note) => set((state) => ({
    orders: state.orders.map((order) => order.id === orderId ? { ...order, customerNote: note } : order),
  })),

  // --- browsing -----------------------------------------------------------
  wishlist: [],
  wishlistItemIds: {},
  wishlistId: null,
  wishlistSync: "local",
  toggleWishlist: (productId) => {
    const state = get();
    const saved = state.wishlist.includes(productId);
    const previousItemIds = state.wishlistItemIds;
    set((current) => ({
      wishlist: saved
        ? current.wishlist.filter((id) => id !== productId)
        : [...current.wishlist, productId],
    }));
    if (!isBackendConfigured() || !state.wishlistId) return;
    const wishlistId = state.wishlistId;
    const sync = saved
      ? (async () => {
        const itemId = previousItemIds[productId];
        if (!itemId) return;
        await removeWishlistItem(wishlistId, itemId);
        set((current) => {
          const rest = Object.fromEntries(Object.entries(current.wishlistItemIds).filter(([key]) => key !== productId));
          return { wishlistItemIds: rest };
        });
      })()
      : (async () => {
        const item = await addWishlistItem(wishlistId, productId);
        set((current) => ({ wishlistItemIds: { ...current.wishlistItemIds, [productId]: item.id } }));
      })();
    sync.catch(() => {
      set((current) => ({
        wishlist: saved
          ? [...current.wishlist, productId]
          : current.wishlist.filter((id) => id !== productId),
        wishlistSync: "error",
      }));
    });
  },
  syncWishlist: async () => {
    if (!isBackendConfigured() || !get().isSignedIn) return;
    set({ wishlistSync: "syncing" });
    try {
      const { wishlistId, itemIds } = await getOrCreateDefaultWishlist();
      set((state) => ({ wishlistId, wishlistItemIds: itemIds, wishlist: Object.keys(itemIds), wishlistSync: "synced", sync: { ...state.sync, wishlist: "synced" } }));
    } catch {
      set((state) => ({ wishlistSync: "error", sync: { ...state.sync, wishlist: "error" } }));
    }
  },
  recentlyViewed: [],
  markViewed: (productId) => set((state) => ({
    recentlyViewed: [productId, ...state.recentlyViewed.filter((id) => id !== productId)].slice(0, 8),
  })),

  // --- account ------------------------------------------------------------
  firstName: "",
  lastName: "",
  updateName: (firstName, lastName) => {
    set({ firstName, lastName });
    if (isBackendConfigured()) void updateMe({ firstName, lastName }).catch(() => undefined);
  },
  addressId: "",
  addresses: [],
  setAddressId: (addressId) => set({ addressId }),
  addAddress: async (address) => {
    if (!isBackendConfigured() || !get().isSignedIn) {
      throw new Error("Connect to the server and sign in to save an address.");
    }

    const created = await createAddressApi({
      label: address.label,
      receiverName: address.receiverName,
      receiverPhone: address.receiverPhone,
      houseNo: address.line1,
      area: address.line2 || address.city,
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
      isDefault: true,
    });
    const newAddress: Address = {
      id: created.id,
      label: created.label || address.label,
      line1: created.houseNo ? `${created.houseNo}, ${created.street || created.area}` : address.line1,
      line2: created.landmark ? `Near ${created.landmark}` : address.line2,
      city: created.city,
      state: created.state,
      pincode: created.pincode,
    };
    set((state) => ({
      addresses: [newAddress, ...state.addresses.filter((item) => item.id !== created.id)],
      addressId: created.id,
    }));
    return created.id;
  },
  deleteAddress: async (addressId) => {
    const state = get();
    if (state.addresses.length <= 1) return false;
    if (isBackendConfigured() && get().isSignedIn && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(addressId)) {
      void deleteAddressApi(addressId).catch(() => {});
    }
    const addresses = state.addresses.filter((address) => address.id !== addressId);
    const fallbackAddress = addresses[0];
    if (!fallbackAddress) return false;
    set({ addresses, addressId: state.addressId === addressId ? fallbackAddress.id : state.addressId });
    return true;
  },
  email: "",
  phone: "",
  sessions: [],
  revokeSession: (sessionId) => {
    const session = get().sessions.find((item) => item.id === sessionId);
    if (!session || session.current) return false;
    if (isBackendConfigured()) void revokeMySession(sessionId).catch(() => undefined);
    set((state) => ({ sessions: state.sessions.filter((item) => item.id !== sessionId) }));
    return true;
  },
  revokeOtherSessions: () => {
    const others = get().sessions.filter((session) => !session.current);
    if (!others.length) return 0;
    if (isBackendConfigured()) {
      void Promise.all(others.map((session) => revokeMySession(session.id).catch(() => undefined)));
    }
    set((state) => ({ sessions: state.sessions.filter((session) => session.current) }));
    return others.length;
  },
  isSignedIn: false,
  signIn: async (accessToken) => {
    setApiAccessToken(accessToken ?? null);
    set({ isSignedIn: true });
    void get().refreshAccount().catch(() => {});
  },
  signOut: () => {
    setApiAccessToken(null);
    void signOutRemote();
    set({
      isSignedIn: false,
      cart: [],
      cartStoreId: null,
      wishlistId: null,
      wishlistItemIds: {},
      wishlistSync: "local",
      sync: { profile: "local", sessions: "local", orders: "local", wishlist: "local" },
    });
  },

  // --- live backend sync ---------------------------------------------------
  sync: { profile: "local", sessions: "local", orders: "local", wishlist: "local" },
  bootstrap: async () => {
    await initConnection();
  },
  refreshAccount: async () => {
    if (!isBackendConfigured()) return;
    await Promise.all([
      get().syncProfile(),
      get().syncAddresses(),
      get().syncCart(),
      get().syncSessions(),
      get().syncOrders(),
      get().syncWishlist(),
    ]);
  },
  syncAddresses: async () => {
    if (!isBackendConfigured() || !get().isSignedIn) return;
    try {
      const addresses = await listAddressesApi();
      const mapped: Address[] = addresses.map((address) => ({
        id: address.id,
        label: address.label || "Address",
        line1: address.houseNo ? `${address.houseNo}, ${address.street || address.area}` : address.area,
        line2: address.landmark ? `Near ${address.landmark}` : (address.street || ""),
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      }));
      const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];
      set({ addresses: mapped, addressId: defaultAddress?.id || "" });
    } catch {
      // keep local addresses
    }
  },
  syncCart: async () => {
    if (!isBackendConfigured() || !get().isSignedIn) return;
    try {
      const serverCart = await getMyCart();
      if (serverCart && serverCart.items.length) {
        const cartItems: CartLine[] = serverCart.items.map((i) => ({
          productId: i.storeProductId,
          quantity: i.quantity,
        }));
        set({
          cart: cartItems,
          cartStoreId: serverCart.storeId,
        });
      }
    } catch {
      // keep local cart
    }
  },
  syncProfile: async () => {
    if (!isBackendConfigured()) return;
    set((state) => ({ sync: { ...state.sync, profile: "syncing" } }));
    try {
      const me = await getMe();
      set((state) => ({
        firstName: me.firstName || state.firstName,
        lastName: me.lastName ?? "",
        email: me.email ?? state.email,
        phone: me.phone ?? state.phone,
        sync: { ...state.sync, profile: "synced" },
      }));
    } catch {
      set((state) => ({ sync: { ...state.sync, profile: "error" } }));
    }
  },
  syncSessions: async () => {
    if (!isBackendConfigured()) return;
    set((state) => ({ sync: { ...state.sync, sessions: "syncing" } }));
    try {
      const sessions = await listMySessions();
      const active = sessions.filter((session) => !session.revokedAt).map(mapSession);
      set((state) => ({
        sessions: active.length ? active : state.sessions,
        sync: { ...state.sync, sessions: active.length ? "synced" : "local" },
      }));
    } catch {
      set((state) => ({ sync: { ...state.sync, sessions: "error" } }));
    }
  },
  syncOrders: async () => {
    if (!isBackendConfigured()) return;
    set((state) => ({ sync: { ...state.sync, orders: "syncing" } }));
    try {
      const orders = await listOrders();
      const fallbackStoreId = stores[0]?.id ?? "";
      const live = orders.map((order) => mapOrder(order, fallbackStoreId));
      set((state) => ({
        orders: [...live, ...state.orders.filter((order) => !order.serverId)],
        sync: { ...state.sync, orders: live.length ? "synced" : "local" },
      }));
    } catch {
      set((state) => ({ sync: { ...state.sync, orders: "error" } }));
    }
  },
}));

export const useSelectedAddress = () =>
  useAppStore((state) => state.addresses.find((address) => address.id === state.addressId) ?? state.addresses[0]);

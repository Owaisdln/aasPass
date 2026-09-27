// ---------------------------------------------------------------------------
// Wishlist API — mirrors the backend WishlistModule exactly.
// ---------------------------------------------------------------------------

import { apiFetch } from "./client";

export type WishlistItemResponse = {
  id: string;
  wishlistId: string;
  storeProductId: string;
  createdBy: string | null;
  createdAt: string;
};

export type WishlistResponse = {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  items: WishlistItemResponse[];
};

export const DEFAULT_WISHLIST_NAME = "My essentials";

export const listWishlists = () => apiFetch<WishlistResponse[]>("/wishlists");

export const createWishlist = (name: string, isDefault = false) =>
  apiFetch<WishlistResponse>("/wishlists", {
    method: "POST",
    body: JSON.stringify({ name, isDefault }),
  });

export const addWishlistItem = (wishlistId: string, storeProductId: string) =>
  apiFetch<WishlistItemResponse>(`/wishlists/${wishlistId}/items`, {
    method: "POST",
    body: JSON.stringify({ storeProductId }),
  });

export const removeWishlistItem = (wishlistId: string, itemId: string) =>
  apiFetch<void>(`/wishlists/${wishlistId}/items/${itemId}`, { method: "DELETE" });

export const getOrCreateDefaultWishlist = async () => {
  const wishlists = await listWishlists();
  const existing = wishlists.find((wishlist) => wishlist.isDefault) ?? wishlists[0];
  const wishlist = existing ?? await createWishlist(DEFAULT_WISHLIST_NAME, true);
  const itemIds: Record<string, string> = {};
  for (const item of wishlist.items) itemIds[item.storeProductId] = item.id;
  return { wishlistId: wishlist.id, itemIds };
};

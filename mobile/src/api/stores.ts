// ---------------------------------------------------------------------------
// Stores API — interacts with backend StoresController (/stores)
// ---------------------------------------------------------------------------

import { apiFetch } from "./client";

export type BackendStoreResponse = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  status: string;
  verificationStatus: string;
  isOpen: boolean;
  deliverySetting?: {
    id: string;
    isDeliveryAvailable: boolean;
    isPickupAvailable: boolean;
    minimumOrderAmount: number;
    deliveryCharge: number;
    freeDeliveryAbove: number | null;
    deliveryRadiusKm: number;
    estimatedDeliveryTime: number;
  } | null;
  hours?: {
    weekDay: string;
    openingTime: string | null;
    closingTime: string | null;
    isClosed: boolean;
  }[];
};

export type BackendStoreProductResponse = {
  id: string;
  storeId: string;
  masterProductId: string;
  mrp: number;
  sellingPrice: number;
  availabilityStatus: string;
  trackInventory: boolean;
  isFeatured: boolean;
  displayOrder: number;
  masterProduct: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sku: string;
    gstRate: number;
    unitValue: number;
    category?: { id: string; name: string; slug: string } | null;
    brand?: { id: string; name: string; slug: string } | null;
    unit?: { id: string; name: string; symbol: string } | null;
    images?: { id: string; objectKey: string; imageType: string; isPrimary: boolean; displayOrder: number }[];
  };
  inventory?: {
    stockQuantity: number;
    reservedQuantity: number;
  } | null;
};

export const browseStores = () =>
  apiFetch<BackendStoreResponse[]>("/stores/browse");

export const getStoreProducts = (storeId: string) =>
  apiFetch<BackendStoreProductResponse[]>(`/stores/${storeId}/products`);

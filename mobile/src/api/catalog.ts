// ---------------------------------------------------------------------------
// Catalog API — mirrors the backend CatalogModule (read paths only).
// ---------------------------------------------------------------------------

import { apiFetch } from "./client";

export type CategoryResponse = {
  id: string;
  parentCategoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageKey: string | null;
  iconKey: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type BrandResponse = {
  id: string;
  name: string;
  slug: string;
  logoKey: string | null;
  isActive: boolean;
};

export type MasterProductResponse = {
  id: string;
  categoryId: string;
  brandId: string | null;
  unitId: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string;
  gstRate: string;
  unitValue: string;
  isFeatured: boolean;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
};

export const listCategories = () => apiFetch<CategoryResponse[]>("/catalog/categories");
export const listBrands = () => apiFetch<BrandResponse[]>("/catalog/brands");
export const listMasterProducts = () => apiFetch<MasterProductResponse[]>("/catalog/master-products");
export const listProductImages = (masterProductId: string) =>
  apiFetch<{ id: string; masterProductId: string; imageKey: string; sortOrder: number }[]>(
    `/catalog/product-images/product/${masterProductId}`,
  );

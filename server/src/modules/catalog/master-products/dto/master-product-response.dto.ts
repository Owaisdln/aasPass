export class MasterProductResponseDto {
  id: string;

  categoryId: string;
  brandId: string | null;
  unitId: string;

  name: string;
  slug: string;
  description: string | null;

  sku: string;
  barcode: string | null;
  hsnCode: string | null;

  gstRate: string;
  unitValue: string;

  isVeg: boolean | null;
  isFeatured: boolean;

  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

  createdAt: Date;
  updatedAt: Date;
}
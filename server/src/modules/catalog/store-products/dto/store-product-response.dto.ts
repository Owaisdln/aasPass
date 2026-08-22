import { AvailabilityStatus } from '@prisma/client';

export class StoreProductResponseDto {
  id: string;

  storeId: string;
  masterProductId: string;

  mrp: string;
  sellingPrice: string;

  availabilityStatus: AvailabilityStatus;
  trackInventory: boolean;
  isFeatured: boolean;
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}
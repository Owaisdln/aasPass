export class InventoryResponseDto {
  id: string;
  storeProductId: string;

  stockQuantity: number;
  reservedQuantity: number;

  lowStockThreshold: number;
  reorderLevel: number;

  version: number;
  lastStockUpdate: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
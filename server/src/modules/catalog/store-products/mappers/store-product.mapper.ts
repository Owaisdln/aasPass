import { StoreProduct } from '@prisma/client';

import { StoreProductResponseDto } from '../dto/store-product-response.dto';

export class StoreProductMapper {
  static toResponse(
    storeProduct: StoreProduct,
  ): StoreProductResponseDto {
    return {
      id: storeProduct.id,

      storeId: storeProduct.storeId,
      masterProductId: storeProduct.masterProductId,

      mrp: storeProduct.mrp.toString(),
      sellingPrice: storeProduct.sellingPrice.toString(),

      availabilityStatus:
        storeProduct.availabilityStatus,

      trackInventory:
        storeProduct.trackInventory,

      isFeatured:
        storeProduct.isFeatured,

      displayOrder:
        storeProduct.displayOrder,

      createdAt:
        storeProduct.createdAt,

      updatedAt:
        storeProduct.updatedAt,
    };
  }
}
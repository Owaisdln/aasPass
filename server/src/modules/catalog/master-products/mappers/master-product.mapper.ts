import { MasterProduct } from '@prisma/client';

import { MasterProductResponseDto } from '../dto/master-product-response.dto';

export class MasterProductMapper {
  static toResponse(
    product: MasterProduct,
  ): MasterProductResponseDto {
    return {
      id: product.id,

      categoryId: product.categoryId,
      brandId: product.brandId,
      unitId: product.unitId,

      name: product.name,
      slug: product.slug,
      description: product.description,

      sku: product.sku,
      barcode: product.barcode,
      hsnCode: product.hsnCode,

      gstRate: product.gstRate.toString(),
      unitValue: product.unitValue.toString(),

      isVeg: product.isVeg,
      isFeatured: product.isFeatured,

      status: product.status,

      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
import { ProductImage } from '@prisma/client';

import { ProductImageResponseDto } from '../dto/product-image-response.dto';

export class ProductImageMapper {
  static toResponse(
    image: ProductImage,
  ): ProductImageResponseDto {
    return {
      id: image.id,
      masterProductId: image.masterProductId,
      objectKey: image.objectKey,
      imageType: image.imageType,
      isPrimary: image.isPrimary,
      displayOrder: image.displayOrder,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }
}
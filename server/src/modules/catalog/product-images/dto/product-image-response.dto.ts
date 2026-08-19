import { ProductImageType } from '@prisma/client';

export class ProductImageResponseDto {
  id: string;
  masterProductId: string;
  objectKey: string;
  imageType: ProductImageType;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
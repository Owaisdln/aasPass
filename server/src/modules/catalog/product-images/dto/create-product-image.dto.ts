import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { ProductImageType } from '@prisma/client';

export class CreateProductImageDto {
  @IsUUID()
  masterProductId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  objectKey: string;

  @IsEnum(ProductImageType)
  imageType: ProductImageType;

  @IsInt()
  @Min(1)
  displayOrder: number;
}
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { ProductImageType } from '@prisma/client';

export class UpdateProductImageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  objectKey?: string;

  @IsOptional()
  @IsEnum(ProductImageType)
  imageType?: ProductImageType;

  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;
}
import {
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateInventoryDto {
  @IsUUID()
  storeProductId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reservedQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number;
}
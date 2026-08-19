import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMasterProductDto {
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  brandId?: string | null;

  @IsUUID()
  unitId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  gstRate: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitValue: number;

  @IsOptional()
  @IsBoolean()
  isVeg?: boolean | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
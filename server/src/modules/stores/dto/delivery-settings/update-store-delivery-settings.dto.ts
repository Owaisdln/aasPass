import {
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateStoreDeliverySettingsDto {
  @IsOptional()
  @IsBoolean()
  isDeliveryAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isPickupAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryRadiusKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeDeliveryAbove?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDeliveryTime?: number;
}
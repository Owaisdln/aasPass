export class StoreDeliverySettingsResponseDto {
  id: string;

  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;

  minimumOrderAmount: number;
  deliveryRadiusKm: number;
  deliveryCharge: number;

  freeDeliveryAbove: number | null;

  estimatedDeliveryTime: number;

  createdAt: Date;
  updatedAt: Date;
}
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

import { UpdateStoreDeliverySettingsDto } from '../../dto/delivery-settings/update-store-delivery-settings.dto';
import { StoreDeliverySettingsResponseDto } from '../../dto/delivery-settings/store-delivery-settings-response.dto';

@Injectable()
export class StoreDeliverySettingsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getMyDeliverySettings(
    userId: string,
  ): Promise<StoreDeliverySettingsResponseDto> {
    const store = await this.prisma.store.findUnique({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!store) {
      throw new NotFoundException(
        'Store not found.',
      );
    }

    const settings =
      await this.prisma.storeDeliverySetting.findUnique({
        where: {
          storeId: store.id,
        },
      });

    if (!settings) {
      throw new NotFoundException(
        'Store delivery settings not found.',
      );
    }

    return this.toResponse(settings);
  }

  async updateMyDeliverySettings(
    userId: string,
    dto: UpdateStoreDeliverySettingsDto,
  ): Promise<StoreDeliverySettingsResponseDto> {
    const store = await this.prisma.store.findUnique({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!store) {
      throw new NotFoundException(
        'Store not found.',
      );
    }

    const settings =
      await this.prisma.storeDeliverySetting.upsert({
        where: {
          storeId: store.id,
        },

        create: {
          storeId: store.id,

          ...(dto.isDeliveryAvailable !== undefined && {
            isDeliveryAvailable:
              dto.isDeliveryAvailable,
          }),

          ...(dto.isPickupAvailable !== undefined && {
            isPickupAvailable:
              dto.isPickupAvailable,
          }),

          ...(dto.minimumOrderAmount !== undefined && {
            minimumOrderAmount:
              dto.minimumOrderAmount,
          }),

          ...(dto.deliveryRadiusKm !== undefined && {
            deliveryRadiusKm:
              dto.deliveryRadiusKm,
          }),

          ...(dto.deliveryCharge !== undefined && {
            deliveryCharge:
              dto.deliveryCharge,
          }),

          ...(dto.freeDeliveryAbove !== undefined && {
            freeDeliveryAbove:
              dto.freeDeliveryAbove,
          }),

          ...(dto.estimatedDeliveryTime !== undefined && {
            estimatedDeliveryTime:
              dto.estimatedDeliveryTime,
          }),
        },

        update: {
          ...(dto.isDeliveryAvailable !== undefined && {
            isDeliveryAvailable:
              dto.isDeliveryAvailable,
          }),

          ...(dto.isPickupAvailable !== undefined && {
            isPickupAvailable:
              dto.isPickupAvailable,
          }),

          ...(dto.minimumOrderAmount !== undefined && {
            minimumOrderAmount:
              dto.minimumOrderAmount,
          }),

          ...(dto.deliveryRadiusKm !== undefined && {
            deliveryRadiusKm:
              dto.deliveryRadiusKm,
          }),

          ...(dto.deliveryCharge !== undefined && {
            deliveryCharge:
              dto.deliveryCharge,
          }),

          ...(dto.freeDeliveryAbove !== undefined && {
            freeDeliveryAbove:
              dto.freeDeliveryAbove,
          }),

          ...(dto.estimatedDeliveryTime !== undefined && {
            estimatedDeliveryTime:
              dto.estimatedDeliveryTime,
          }),
        },
      });

    return this.toResponse(settings);
  }

  private toResponse(
    settings: {
      id: string;
      isDeliveryAvailable: boolean;
      isPickupAvailable: boolean;
      minimumOrderAmount: unknown;
      deliveryRadiusKm: unknown;
      deliveryCharge: unknown;
      freeDeliveryAbove: unknown;
      estimatedDeliveryTime: number;
      createdAt: Date;
      updatedAt: Date;
    },
  ): StoreDeliverySettingsResponseDto {
    return {
      id: settings.id,

      isDeliveryAvailable:
        settings.isDeliveryAvailable,

      isPickupAvailable:
        settings.isPickupAvailable,

      minimumOrderAmount:
        Number(settings.minimumOrderAmount),

      deliveryRadiusKm:
        Number(settings.deliveryRadiusKm),

      deliveryCharge:
        Number(settings.deliveryCharge),

      freeDeliveryAbove:
        settings.freeDeliveryAbove === null
          ? null
          : Number(settings.freeDeliveryAbove),

      estimatedDeliveryTime:
        settings.estimatedDeliveryTime,

      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
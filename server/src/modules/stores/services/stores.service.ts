import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

import { CreateStoreDto } from '../dto/create-store.dto';
import { StoreResponseDto } from '../dto/store-response.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { StoreMapper } from '../mappers/store.mapper';
import {
  STORE_WITH_RELATIONS_INCLUDE,
  StoreWithRelations,
} from '../types/store.types';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeMapper: StoreMapper,
  ) {}

  async createStore(
    userId: string,
    dto: CreateStoreDto,
  ): Promise<StoreResponseDto> {
    const existingStore =
      await this.prisma.store.findUnique({
        where: {
          ownerId: userId,
        },
      });

    if (existingStore) {
      throw new ConflictException(
        'You already have a store.',
      );
    }

    const slug = await this.generateUniqueSlug(
      dto.name,
    );

    const store =
      await this.prisma.store.create({
        data: {
          ownerId: userId,

          name: dto.name,
          slug,
          description: dto.description,

          phone: dto.phone,
          email: dto.email,

          gstNumber: dto.gstNumber,
          businessRegistrationNumber:
            dto.businessRegistrationNumber,

          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,

          city: dto.city,
          state: dto.state,
          country: dto.country,
          pincode: dto.pincode,

          latitude: dto.latitude,
          longitude: dto.longitude,

          timezone:
            dto.timezone ?? 'Asia/Kolkata',

          createdBy: userId,
          updatedBy: userId,
        },

        include:
          STORE_WITH_RELATIONS_INCLUDE,
      });

    return this.storeMapper.toResponse(store);
  }

  async getMyStore(
    userId: string,
  ): Promise<StoreResponseDto> {
    const store = await this.resolveOwnStore(userId);

    return this.storeMapper.toResponse(store);
  }

  async updateStore(
    userId: string,
    dto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    const store = await this.resolveOwnStore(userId);

    const updatedStore =
      await this.prisma.store.update({
        where: {
          id: store.id,
        },

        data: {
          ...(dto.name !== undefined && {
            name: dto.name,
          }),

          ...(dto.description !== undefined && {
            description: dto.description,
          }),

          ...(dto.phone !== undefined && {
            phone: dto.phone,
          }),

          ...(dto.email !== undefined && {
            email: dto.email,
          }),

          ...(dto.gstNumber !== undefined && {
            gstNumber: dto.gstNumber,
          }),

          ...(dto.businessRegistrationNumber !==
            undefined && {
            businessRegistrationNumber:
              dto.businessRegistrationNumber,
          }),

          ...(dto.addressLine1 !== undefined && {
            addressLine1: dto.addressLine1,
          }),

          ...(dto.addressLine2 !== undefined && {
            addressLine2: dto.addressLine2,
          }),

          ...(dto.city !== undefined && {
            city: dto.city,
          }),

          ...(dto.state !== undefined && {
            state: dto.state,
          }),

          ...(dto.country !== undefined && {
            country: dto.country,
          }),

          ...(dto.pincode !== undefined && {
            pincode: dto.pincode,
          }),

          ...(dto.latitude !== undefined && {
            latitude: dto.latitude,
          }),

          ...(dto.longitude !== undefined && {
            longitude: dto.longitude,
          }),

          ...(dto.timezone !== undefined && {
            timezone: dto.timezone,
          }),

          ...(dto.logoKey !== undefined && {
            logoKey: dto.logoKey,
          }),

          ...(dto.bannerKey !== undefined && {
            bannerKey: dto.bannerKey,
          }),

          updatedBy: userId,
        },

        include:
          STORE_WITH_RELATIONS_INCLUDE,
      });

    return this.storeMapper.toResponse(updatedStore);
  }

  private async resolveOwnStore(
    userId: string,
  ): Promise<StoreWithRelations> {
    const store =
      await this.prisma.store.findUnique({
        where: {
          ownerId: userId,
        },

        include:
          STORE_WITH_RELATIONS_INCLUDE,
      });

    if (!store) {
      throw new NotFoundException(
        'Store not found.',
      );
    }

    return store;
  }

  private async generateUniqueSlug(
    name: string,
  ): Promise<string> {
    const baseSlug = this.slugify(name);

    let slug = baseSlug;
    let counter = 1;

    while (
      await this.prisma.store.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
        },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private slugify(value: string): string {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    return slug || 'store';
  }

  /** Public: list all active, open stores for customer browsing */
  async browseStores() {
    return this.prisma.store.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      include: {
        deliverySetting: true,
        hours: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Public: get all AVAILABLE products for a specific store */
  async getStoreProducts(storeId: string) {
    return this.prisma.storeProduct.findMany({
      where: {
        storeId,
        availabilityStatus: 'AVAILABLE',
        deletedAt: null,
      },
      include: {
        masterProduct: {
          include: {
            category: true,
            brand: true,
            unit: true,
            images: {
              orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
            },
          },
        },
        inventory: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { displayOrder: 'asc' },
      ],
    });
  }
}

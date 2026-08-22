import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AvailabilityStatus,
  Prisma,
  StoreProduct,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

import { CreateStoreProductDto } from '../dto/create-store-product.dto';
import { UpdateStoreProductDto } from '../dto/update-store-product.dto';
import { StoreProductResponseDto } from '../dto/store-product-response.dto';
import { StoreProductMapper } from '../mappers/store-product.mapper';

@Injectable()
export class StoreProductsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateStoreProductDto,
  ): Promise<StoreProductResponseDto> {
    const store = await this.resolveOwnStore(userId);

    await this.ensureMasterProductExists(
      dto.masterProductId,
    );

    await this.ensureStoreProductDoesNotExist(
      store.id,
      dto.masterProductId,
    );

    this.validatePricing(
      dto.mrp,
      dto.sellingPrice,
    );

    try {
      const storeProduct =
        await this.prisma.storeProduct.create({
          data: {
            storeId: store.id,
            masterProductId:
              dto.masterProductId,

            mrp: dto.mrp,
            sellingPrice:
              dto.sellingPrice,

            availabilityStatus:
              dto.availabilityStatus ??
              AvailabilityStatus.AVAILABLE,

            trackInventory:
              dto.trackInventory ?? true,

            isFeatured:
              dto.isFeatured ?? false,

            displayOrder:
              dto.displayOrder ?? 0,

            createdBy: userId,
            updatedBy: userId,
          },
        });

      return StoreProductMapper.toResponse(
        storeProduct,
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findMine(
    userId: string,
  ): Promise<StoreProductResponseDto[]> {
    const store =
      await this.resolveOwnStore(userId);

    const storeProducts =
      await this.prisma.storeProduct.findMany({
        where: {
          storeId: store.id,
          deletedAt: null,
        },
        orderBy: [
          {
            displayOrder: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

    return storeProducts.map((storeProduct) =>
      StoreProductMapper.toResponse(
        storeProduct,
      ),
    );
  }

  async findMineById(
    userId: string,
    id: string,
  ): Promise<StoreProductResponseDto> {
    const store =
      await this.resolveOwnStore(userId);

    const storeProduct =
      await this.findStoreProduct(
        id,
        store.id,
      );

    return StoreProductMapper.toResponse(
      storeProduct,
    );
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateStoreProductDto,
  ): Promise<StoreProductResponseDto> {
    const store =
      await this.resolveOwnStore(userId);

    const existing =
      await this.findStoreProduct(
        id,
        store.id,
      );

    const mrp =
      dto.mrp ?? Number(existing.mrp);

    const sellingPrice =
      dto.sellingPrice ??
      Number(existing.sellingPrice);

    this.validatePricing(
      mrp,
      sellingPrice,
    );

    const data: Prisma.StoreProductUpdateInput =
      {
        updatedBy: userId,
      };

    if (dto.mrp !== undefined) {
      data.mrp = dto.mrp;
    }

    if (dto.sellingPrice !== undefined) {
      data.sellingPrice =
        dto.sellingPrice;
    }

    if (
      dto.availabilityStatus !==
      undefined
    ) {
      data.availabilityStatus =
        dto.availabilityStatus;
    }

    if (dto.trackInventory !== undefined) {
      data.trackInventory =
        dto.trackInventory;
    }

    if (dto.isFeatured !== undefined) {
      data.isFeatured =
        dto.isFeatured;
    }

    if (dto.displayOrder !== undefined) {
      data.displayOrder =
        dto.displayOrder;
    }

    try {
      const updated =
        await this.prisma.storeProduct.update({
          where: {
            id,
          },
          data,
        });

      return StoreProductMapper.toResponse(
        updated,
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<void> {
    const store =
      await this.resolveOwnStore(userId);

    const existing =
      await this.findStoreProduct(
        id,
        store.id,
      );

    try {
      await this.prisma.storeProduct.update({
        where: {
          id: existing.id,
        },
        data: {
          deletedAt: new Date(),
          updatedBy: userId,
          isFeatured: false,
          availabilityStatus:
            AvailabilityStatus.HIDDEN,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private async resolveOwnStore(
    userId: string,
  ) {
    const store =
      await this.prisma.store.findUnique({
        where: {
          ownerId: userId,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Store not found for the current user',
      );
    }

    return store;
  }

  private async ensureMasterProductExists(
    masterProductId: string,
  ): Promise<void> {
    const product =
      await this.prisma.masterProduct.findFirst({
        where: {
          id: masterProductId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Master product not found',
      );
    }
  }

  private async ensureStoreProductDoesNotExist(
    storeId: string,
    masterProductId: string,
  ): Promise<void> {
    const existing =
      await this.prisma.storeProduct.findUnique({
        where: {
          storeId_masterProductId: {
            storeId,
            masterProductId,
          },
        },
        select: {
          id: true,
          deletedAt: true,
        },
      });

    if (existing) {
      throw new ConflictException(
        existing.deletedAt
          ? 'This product has previously been removed from the store and cannot be recreated with the same store-product relationship'
          : 'This product is already listed in the store',
      );
    }
  }

  private async findStoreProduct(
    id: string,
    storeId: string,
  ): Promise<StoreProduct> {
    const storeProduct =
      await this.prisma.storeProduct.findFirst({
        where: {
          id,
          storeId,
          deletedAt: null,
        },
      });

    if (!storeProduct) {
      throw new NotFoundException(
        'Store product not found',
      );
    }

    return storeProduct;
  }

  private validatePricing(
    mrp: number,
    sellingPrice: number,
  ): void {
    if (sellingPrice > mrp) {
      throw new ConflictException(
        'Selling price cannot be greater than MRP',
      );
    }
  }

  private handlePrismaError(
    error: unknown,
  ): never {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'This product is already listed in the store',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Store product not found',
        );
      }

      if (error.code === 'P2003') {
        throw new ConflictException(
          'Store product references an invalid record',
        );
      }
    }

    throw error;
  }
}
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProductStatus,
  StoreStatus,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

import { AddWishlistItemDto } from '../dto/add-wishlist-item.dto';
import { CreateWishlistDto } from '../dto/create-wishlist.dto';
import { UpdateWishlistDto } from '../dto/update-wishlist.dto';
import { WishlistItemResponseDto } from '../dto/wishlist-item-response.dto';
import { WishlistResponseDto } from '../dto/wishlist-response.dto';

import { WishlistMapper } from '../mappers/wishlist.mapper';
import { WISHLIST_WITH_ITEMS_INCLUDE } from '../types/wishlist.types';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateWishlistDto,
  ): Promise<WishlistResponseDto> {
    const name = dto.name.trim();

    if (!name) {
      throw new ConflictException(
        'Wishlist name cannot be empty',
      );
    }

    try {
      const wishlist = await this.prisma.$transaction(
        async (tx) => {
          if (dto.isDefault === true) {
            await tx.wishlist.updateMany({
              where: {
                userId,
                deletedAt: null,
                isDefault: true,
              },
              data: {
                isDefault: false,
                updatedBy: userId,
              },
            });
          }

          return tx.wishlist.create({
            data: {
              userId,
              name,
              isDefault: dto.isDefault ?? false,
              createdBy: userId,
              updatedBy: userId,
            },
            include: WISHLIST_WITH_ITEMS_INCLUDE,
          });
        },
      );

      return WishlistMapper.toResponse(wishlist);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A wishlist with this name already exists',
        );
      }

      throw error;
    }
  }

  async findAll(
    userId: string,
  ): Promise<WishlistResponseDto[]> {
    const wishlists = await this.prisma.wishlist.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: WISHLIST_WITH_ITEMS_INCLUDE,
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    return wishlists.map(WishlistMapper.toResponse);
  }

  async findOne(
    userId: string,
    wishlistId: string,
  ): Promise<WishlistResponseDto> {
    const wishlist = await this.findOwnedWishlist(
      userId,
      wishlistId,
    );

    return WishlistMapper.toResponse(wishlist);
  }

  async update(
    userId: string,
    wishlistId: string,
    dto: UpdateWishlistDto,
  ): Promise<WishlistResponseDto> {
    const wishlist = await this.findOwnedWishlist(
      userId,
      wishlistId,
    );

    const name = dto.name.trim();

    if (!name) {
      throw new ConflictException(
        'Wishlist name cannot be empty',
      );
    }

    try {
      const updated = await this.prisma.wishlist.update({
        where: {
          id: wishlist.id,
        },
        data: {
          name,
          updatedBy: userId,
        },
        include: WISHLIST_WITH_ITEMS_INCLUDE,
      });

      return WishlistMapper.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A wishlist with this name already exists',
        );
      }

      throw error;
    }
  }

  async setDefault(
    userId: string,
    wishlistId: string,
  ): Promise<WishlistResponseDto> {
    await this.findOwnedWishlist(
      userId,
      wishlistId,
    );

    const wishlist = await this.prisma.$transaction(
      async (tx) => {
        await tx.wishlist.updateMany({
          where: {
            userId,
            deletedAt: null,
            isDefault: true,
          },
          data: {
            isDefault: false,
            updatedBy: userId,
          },
        });

        return tx.wishlist.update({
          where: {
            id: wishlistId,
          },
          data: {
            isDefault: true,
            updatedBy: userId,
          },
          include: WISHLIST_WITH_ITEMS_INCLUDE,
        });
      },
    );

    return WishlistMapper.toResponse(wishlist);
  }

  async remove(
    userId: string,
    wishlistId: string,
  ): Promise<void> {
    const wishlist = await this.findOwnedWishlist(
      userId,
      wishlistId,
    );

    if (wishlist.isDefault) {
      throw new ConflictException(
        'The default wishlist cannot be deleted',
      );
    }

    await this.prisma.wishlist.update({
      where: {
        id: wishlist.id,
      },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
        isDefault: false,
      },
    });
  }

  async addItem(
    userId: string,
    wishlistId: string,
    dto: AddWishlistItemDto,
  ): Promise<WishlistItemResponseDto> {
    await this.findOwnedWishlist(
      userId,
      wishlistId,
    );

    const storeProduct =
      await this.prisma.storeProduct.findFirst({
        where: {
          id: dto.storeProductId,
          deletedAt: null,
          availabilityStatus: {
            not: 'DISCONTINUED',
          },
          store: {
            deletedAt: null,
            status: StoreStatus.ACTIVE,
          },
          masterProduct: {
            deletedAt: null,
            status: ProductStatus.ACTIVE,
          },
        },
      });

    if (!storeProduct) {
      throw new NotFoundException(
        'Store product not found or unavailable',
      );
    }

    try {
      const item =
        await this.prisma.wishlistItem.create({
          data: {
            wishlistId,
            storeProductId: dto.storeProductId,
            createdBy: userId,
          },
        });

      return WishlistMapper.toItemResponse(item);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Product is already in this wishlist',
        );
      }

      throw error;
    }
  }

  async removeItem(
    userId: string,
    wishlistId: string,
    itemId: string,
  ): Promise<void> {
    await this.findOwnedWishlist(
      userId,
      wishlistId,
    );

    const item =
      await this.prisma.wishlistItem.findFirst({
        where: {
          id: itemId,
          wishlistId,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Wishlist item not found',
      );
    }

    await this.prisma.wishlistItem.delete({
      where: {
        id: item.id,
      },
    });
  }

  async clear(
    userId: string,
    wishlistId: string,
  ): Promise<void> {
    await this.findOwnedWishlist(
      userId,
      wishlistId,
    );

    await this.prisma.wishlistItem.deleteMany({
      where: {
        wishlistId,
      },
    });
  }

  private async findOwnedWishlist(
    userId: string,
    wishlistId: string,
  ) {
    const wishlist =
      await this.prisma.wishlist.findFirst({
        where: {
          id: wishlistId,
          userId,
          deletedAt: null,
        },
        include: WISHLIST_WITH_ITEMS_INCLUDE,
      });

    if (!wishlist) {
      throw new NotFoundException(
        'Wishlist not found',
      );
    }

    return wishlist;
  }
}
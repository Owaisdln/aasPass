import { Wishlist, WishlistItem } from '@prisma/client';

import { WishlistItemResponseDto } from '../dto/wishlist-item-response.dto';
import { WishlistResponseDto } from '../dto/wishlist-response.dto';
import { WishlistWithItems } from '../types/wishlist.types';

export class WishlistMapper {
  static toItemResponse(
    item: WishlistItem,
  ): WishlistItemResponseDto {
    return {
      id: item.id,
      wishlistId: item.wishlistId,
      storeProductId: item.storeProductId,
      createdBy: item.createdBy,
      createdAt: item.createdAt,
    };
  }

  static toResponse(
    wishlist: WishlistWithItems,
  ): WishlistResponseDto {
    return {
      id: wishlist.id,
      userId: wishlist.userId,
      name: wishlist.name,
      isDefault: wishlist.isDefault,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
      items: wishlist.items.map(
        WishlistMapper.toItemResponse,
      ),
    };
  }

  static toBasicResponse(
    wishlist: Wishlist,
  ): WishlistResponseDto {
    return {
      id: wishlist.id,
      userId: wishlist.userId,
      name: wishlist.name,
      isDefault: wishlist.isDefault,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
      items: [],
    };
  }
}
import { WishlistItemResponseDto } from './wishlist-item-response.dto';

export class WishlistResponseDto {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: WishlistItemResponseDto[];
}
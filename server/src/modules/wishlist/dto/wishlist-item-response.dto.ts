export class WishlistItemResponseDto {
  id: string;
  wishlistId: string;
  storeProductId: string;
  createdBy: string | null;
  createdAt: Date;
}
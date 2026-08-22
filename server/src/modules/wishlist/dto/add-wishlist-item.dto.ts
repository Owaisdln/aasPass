import { IsUUID } from 'class-validator';

export class AddWishlistItemDto {
  @IsUUID()
  storeProductId: string;
}
import { IsInt, IsUUID, Min, Max } from 'class-validator';
import { MAX_PRODUCT_QUANTITY } from '../constants';

export class UpsertCartItemDto {
  @IsUUID()
  storeProductId: string;

  @IsInt()
  @Min(0)
  @Max(MAX_PRODUCT_QUANTITY)
  quantity: number;
}

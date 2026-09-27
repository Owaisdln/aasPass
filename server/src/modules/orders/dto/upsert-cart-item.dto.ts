import { IsInt, IsUUID, Min, Max } from 'class-validator';

export class UpsertCartItemDto {
  @IsUUID()
  storeProductId: string;

  @IsInt()
  @Min(0)
  @Max(50)
  quantity: number;
}

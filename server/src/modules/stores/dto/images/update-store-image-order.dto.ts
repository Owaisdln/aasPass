import {
  IsInt,
  Min,
} from 'class-validator';

export class UpdateStoreImageOrderDto {
  @IsInt()
  @Min(1)
  displayOrder: number;
}
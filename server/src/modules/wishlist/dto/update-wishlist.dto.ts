import {
  IsString,
  Length,
} from 'class-validator';

export class UpdateWishlistDto {
  @IsString()
  @Length(1, 100)
  name: string;
}
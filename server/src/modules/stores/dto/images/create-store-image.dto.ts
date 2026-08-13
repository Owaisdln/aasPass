import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStoreImageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  objectKey: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;
}
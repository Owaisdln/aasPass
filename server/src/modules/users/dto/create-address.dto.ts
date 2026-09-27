import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @IsString()
  @Length(1, 100)
  receiverName: string;

  @IsString()
  @Length(7, 15)
  receiverPhone: string;

  @IsString()
  @Length(1, 100)
  houseNo: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @IsString()
  @Length(1, 255)
  area: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;

  @IsString()
  @Length(1, 100)
  city: string;

  @IsString()
  @Length(1, 100)
  state: string;

  @IsString()
  @Length(1, 100)
  country: string;

  @IsString()
  @Length(4, 10)
  pincode: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

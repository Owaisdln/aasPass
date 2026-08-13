import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WeekDay } from '@prisma/client';

export class StoreHourInputDto {
  @IsEnum(WeekDay)
  weekDay: WeekDay;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message:
      'openingTime must be in HH:mm format.',
  })
  openingTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message:
      'closingTime must be in HH:mm format.',
  })
  closingTime?: string;

  @IsBoolean()
  isClosed: boolean;
}

export class UpdateStoreHoursDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StoreHourInputDto)
  hours: StoreHourInputDto[];
}
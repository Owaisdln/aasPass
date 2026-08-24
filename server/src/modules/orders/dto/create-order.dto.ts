import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

import { FulfillmentType } from '@prisma/client';

export class CreateOrderDto {
  @IsUUID()
  addressId: string;

  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;
}
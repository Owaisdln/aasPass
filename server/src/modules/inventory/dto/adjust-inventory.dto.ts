import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import {
  InventoryReferenceType,
  InventoryTransactionType,
} from '@prisma/client';

export class AdjustInventoryDto {
  @IsEnum(InventoryTransactionType)
  transactionType: InventoryTransactionType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsEnum(InventoryReferenceType)
  referenceType?: InventoryReferenceType;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  @Min(0)
  expectedVersion: number;
}
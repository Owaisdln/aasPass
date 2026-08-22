import {
  InventoryReferenceType,
  InventoryTransactionType,
} from '@prisma/client';

export class InventoryTransactionResponseDto {
  id: string;
  inventoryId: string;

  transactionType: InventoryTransactionType;
  quantity: number;
  balanceAfterTransaction: number;

  referenceType: InventoryReferenceType | null;
  referenceId: string | null;

  source: string | null;
  notes: string | null;

  createdBy: string | null;
  createdAt: Date;
}
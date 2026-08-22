import {
  Inventory,
  InventoryTransaction,
} from '@prisma/client';

import { InventoryResponseDto } from '../dto/inventory-response.dto';
import { InventoryTransactionResponseDto } from '../dto/inventory-transaction-response.dto';

export class InventoryMapper {
  static toResponse(inventory: Inventory): InventoryResponseDto {
    return {
      id: inventory.id,
      storeProductId: inventory.storeProductId,
      stockQuantity: inventory.stockQuantity,
      reservedQuantity: inventory.reservedQuantity,
      lowStockThreshold: inventory.lowStockThreshold,
      reorderLevel: inventory.reorderLevel,
      version: inventory.version,
      lastStockUpdate: inventory.lastStockUpdate,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
    };
  }

  static toTransactionResponse(
    transaction: InventoryTransaction,
  ): InventoryTransactionResponseDto {
    return {
      id: transaction.id,
      inventoryId: transaction.inventoryId,
      transactionType: transaction.transactionType,
      quantity: transaction.quantity,
      balanceAfterTransaction: transaction.balanceAfterTransaction,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId,
      source: transaction.source,
      notes: transaction.notes,
      createdBy: transaction.createdBy,
      createdAt: transaction.createdAt,
    };
  }
}
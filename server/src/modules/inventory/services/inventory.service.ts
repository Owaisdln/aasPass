import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryReferenceType,
  InventoryTransactionType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateInventoryDto } from '../dto/create-inventory.dto';
import { UpdateInventoryDto } from '../dto/update-inventory.dto';
import { AdjustInventoryDto } from '../dto/adjust-inventory.dto';
import { InventoryResponseDto } from '../dto/inventory-response.dto';
import { InventoryTransactionResponseDto } from '../dto/inventory-transaction-response.dto';
import { InventoryMapper } from '../mappers/inventory.mapper';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateInventoryDto,
  ): Promise<InventoryResponseDto> {
    const storeProduct = await this.prisma.storeProduct.findFirst({
      where: {
        id: dto.storeProductId,
        deletedAt: null,
        store: {
          ownerId: userId,
          deletedAt: null,
        },
      },
      include: {
        inventory: true,
      },
    });

    if (!storeProduct) {
      throw new NotFoundException('Store product not found');
    }

    if (!storeProduct.trackInventory) {
      throw new ConflictException(
        'Inventory tracking is disabled for this store product',
      );
    }

    if (storeProduct.inventory) {
      throw new ConflictException(
        'Inventory already exists for this store product',
      );
    }

    const stockQuantity = dto.stockQuantity ?? 0;
    const reservedQuantity = dto.reservedQuantity ?? 0;
    const lowStockThreshold = dto.lowStockThreshold ?? 10;
    const reorderLevel = dto.reorderLevel ?? 20;

    if (reservedQuantity > stockQuantity) {
      throw new ConflictException(
        'Reserved quantity cannot exceed stock quantity',
      );
    }

    if (reorderLevel < lowStockThreshold) {
      throw new ConflictException(
        'Reorder level cannot be lower than low stock threshold',
      );
    }

    try {
      const inventory = await this.prisma.$transaction(async (tx) => {
        const createdInventory = await tx.inventory.create({
          data: {
            storeProductId: dto.storeProductId,
            stockQuantity,
            reservedQuantity,
            lowStockThreshold,
            reorderLevel,
            version: 0,
            lastStockUpdate: stockQuantity > 0 ? new Date() : null,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        if (stockQuantity > 0) {
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: createdInventory.id,
              transactionType: InventoryTransactionType.RESTOCK,
              quantity: stockQuantity,
              balanceAfterTransaction: stockQuantity,
              referenceType: InventoryReferenceType.MANUAL,
              source: 'inventory.create',
              notes: 'Initial inventory stock',
              createdBy: userId,
            },
          });
        }

        return createdInventory;
      });

      return InventoryMapper.toResponse(inventory);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Inventory already exists for this store product',
        );
      }

      throw error;
    }
  }

  async findAll(userId: string): Promise<InventoryResponseDto[]> {
    const inventories = await this.prisma.inventory.findMany({
      where: {
        storeProduct: {
          deletedAt: null,
          store: {
            ownerId: userId,
            deletedAt: null,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return inventories.map(InventoryMapper.toResponse);
  }

  async findOne(
    userId: string,
    inventoryId: string,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        storeProduct: {
          deletedAt: null,
          store: {
            ownerId: userId,
            deletedAt: null,
          },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    return InventoryMapper.toResponse(inventory);
  }

  async update(
    userId: string,
    inventoryId: string,
    dto: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.findOwnedInventory(
      userId,
      inventoryId,
    );

    const lowStockThreshold =
      dto.lowStockThreshold ?? inventory.lowStockThreshold;

    const reorderLevel =
      dto.reorderLevel ?? inventory.reorderLevel;

    if (reorderLevel < lowStockThreshold) {
      throw new ConflictException(
        'Reorder level cannot be lower than low stock threshold',
      );
    }

    const updated = await this.prisma.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        lowStockThreshold,
        reorderLevel,
        version: {
          increment: 1,
        },
        updatedBy: userId,
      },
    });

    return InventoryMapper.toResponse(updated);
  }

  async adjustStock(
    userId: string,
    inventoryId: string,
    dto: AdjustInventoryDto,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.findOwnedInventory(
      userId,
      inventoryId,
    );

    if (inventory.version !== dto.expectedVersion) {
      throw new ConflictException(
        'Inventory was modified by another request. Refresh and try again.',
      );
    }

    const quantityDelta = this.getQuantityDelta(dto);

    const newStockQuantity =
      inventory.stockQuantity + quantityDelta;

    if (newStockQuantity < 0) {
      throw new ConflictException(
        'Stock quantity cannot become negative',
      );
    }

    if (inventory.reservedQuantity > newStockQuantity) {
      throw new ConflictException(
        'Stock quantity cannot be lower than reserved quantity',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.inventory.updateMany({
        where: {
          id: inventory.id,
          version: dto.expectedVersion,
        },
        data: {
          stockQuantity: newStockQuantity,
          version: {
            increment: 1,
          },
          lastStockUpdate: new Date(),
          updatedBy: userId,
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictException(
          'Inventory was modified by another request. Refresh and try again.',
        );
      }

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          transactionType: dto.transactionType,
          quantity: dto.quantity,
          balanceAfterTransaction: newStockQuantity,
          referenceType:
            dto.referenceType ?? InventoryReferenceType.MANUAL,
          referenceId: dto.referenceId,
          source: dto.source,
          notes: dto.notes,
          createdBy: userId,
        },
      });

      return tx.inventory.findUniqueOrThrow({
        where: {
          id: inventory.id,
        },
      });
    });

    return InventoryMapper.toResponse(updated);
  }

  async getTransactions(
    userId: string,
    inventoryId: string,
  ): Promise<InventoryTransactionResponseDto[]> {
    await this.findOwnedInventory(userId, inventoryId);

    const transactions =
      await this.prisma.inventoryTransaction.findMany({
        where: {
          inventoryId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    return transactions.map(
      InventoryMapper.toTransactionResponse,
    );
  }

  private async findOwnedInventory(
    userId: string,
    inventoryId: string,
  ) {
    const inventory = await this.prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        storeProduct: {
          deletedAt: null,
          store: {
            ownerId: userId,
            deletedAt: null,
          },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    return inventory;
  }

  private getQuantityDelta(dto: AdjustInventoryDto): number {
    switch (dto.transactionType) {
      case InventoryTransactionType.PURCHASE:
      case InventoryTransactionType.RESTOCK:
      case InventoryTransactionType.RETURN:
        return dto.quantity;

      case InventoryTransactionType.SALE:
      case InventoryTransactionType.DAMAGE:
      case InventoryTransactionType.EXPIRED:
        return -dto.quantity;

      case InventoryTransactionType.ADJUSTMENT:
        throw new ConflictException(
          'ADJUSTMENT transactions must be handled explicitly',
        );

      default:
        throw new ConflictException(
          'Unsupported inventory transaction type',
        );
    }
  }
}
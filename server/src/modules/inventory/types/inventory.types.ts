import { Prisma } from '@prisma/client';

export const INVENTORY_WITH_TRANSACTIONS_INCLUDE = {
  transactions: {
    orderBy: {
      createdAt: 'desc',
    },
  },
} as const satisfies Prisma.InventoryInclude;

export type InventoryWithTransactions = Prisma.InventoryGetPayload<{
  include: typeof INVENTORY_WITH_TRANSACTIONS_INCLUDE;
}>;
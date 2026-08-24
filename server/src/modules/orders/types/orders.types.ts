import { Prisma } from '@prisma/client';

export const ORDER_WITH_ITEMS_INCLUDE = {
  items: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} as const satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof ORDER_WITH_ITEMS_INCLUDE;
}>;
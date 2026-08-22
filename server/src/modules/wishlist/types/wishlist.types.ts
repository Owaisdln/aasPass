import { Prisma } from '@prisma/client';

export const WISHLIST_WITH_ITEMS_INCLUDE = {
  items: {
    orderBy: {
      createdAt: 'desc',
    },
  },
} as const satisfies Prisma.WishlistInclude;

export type WishlistWithItems = Prisma.WishlistGetPayload<{
  include: typeof WISHLIST_WITH_ITEMS_INCLUDE;
}>;
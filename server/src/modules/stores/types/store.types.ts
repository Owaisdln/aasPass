import { Prisma } from '@prisma/client';

export const STORE_WITH_RELATIONS_INCLUDE = {
  images: true,
  hours: true,
  deliverySetting: true,
} as const satisfies Prisma.StoreInclude;

export type StoreWithRelations =
  Prisma.StoreGetPayload<{
    include: typeof STORE_WITH_RELATIONS_INCLUDE;
  }>;
import { Prisma } from '@prisma/client';

export const CATEGORY_WITH_PARENT_INCLUDE = {
  parentCategory: true,
} as const satisfies Prisma.CategoryInclude;

export type CategoryWithParent = Prisma.CategoryGetPayload<{
  include: typeof CATEGORY_WITH_PARENT_INCLUDE;
}>;
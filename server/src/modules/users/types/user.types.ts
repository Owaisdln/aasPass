import { Prisma } from '@prisma/client';

export const USER_WITH_ROLE_INCLUDE = {
  role: true,
} satisfies Prisma.UserInclude;

export type UserWithRole = Prisma.UserGetPayload<{
  include: typeof USER_WITH_ROLE_INCLUDE;
}>;
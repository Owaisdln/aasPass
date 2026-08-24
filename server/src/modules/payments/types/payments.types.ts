import { Prisma } from '@prisma/client';

export const PAYMENT_WITH_TRANSACTIONS_INCLUDE = {
  transactions: {
    orderBy: {
      createdAt: 'desc',
    },
  },
} as const satisfies Prisma.PaymentInclude;

export type PaymentWithTransactions =
  Prisma.PaymentGetPayload<{
    include: typeof PAYMENT_WITH_TRANSACTIONS_INCLUDE;
  }>;
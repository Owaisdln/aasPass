import {
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

export class PaymentResponseDto {
  id: string;

  orderId: string;

  paymentMethod: PaymentMethod;
  gateway: PaymentGateway;
  paymentStatus: PaymentStatus;

  payableAmount: number;
  currency: string;

  paidAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
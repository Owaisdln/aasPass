import { Payment } from '@prisma/client';

import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentWithTransactions } from '../types/payments.types';

export class PaymentsMapper {
  static toResponse(
    payment: Payment | PaymentWithTransactions,
  ): PaymentResponseDto {
    return {
      id: payment.id,

      orderId: payment.orderId,

      paymentMethod:
        payment.paymentMethod,

      gateway:
        payment.gateway,

      paymentStatus:
        payment.paymentStatus,

      payableAmount:
        Number(payment.payableAmount),

      currency:
        payment.currency,

      paidAt:
        payment.paidAt,

      createdAt:
        payment.createdAt,

      updatedAt:
        payment.updatedAt,
    };
  }
}
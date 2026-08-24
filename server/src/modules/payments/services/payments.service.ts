import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  OrderStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionStatus,
  Prisma,
  RefundStatus,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

import { CreatePaymentDto } from '../dto/create-payment.dto';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';

import { PaymentsMapper } from '../mappers/payments.mapper';
import {
  PAYMENT_WITH_TRANSACTIONS_INCLUDE,
} from '../types/payments.types';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    orderId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findFirst({
            where: {
              id: orderId,
              userId,
              deletedAt: null,
            },
          });

        if (!order) {
          throw new NotFoundException(
            'Order not found',
          );
        }

        if (
          order.status ===
            OrderStatus.CANCELLED ||
          order.status ===
            OrderStatus.FAILED
        ) {
          throw new ConflictException(
            'Payment cannot be created for this order',
          );
        }

        const existingPayment =
          await tx.payment.findUnique({
            where: {
              orderId,
            },
          });

        if (existingPayment) {
          throw new ConflictException(
            'Payment already exists for this order',
          );
        }

        const gateway =
          dto.paymentMethod ===
          PaymentMethod.COD
            ? PaymentGateway.CASH
            : PaymentGateway.RAZORPAY;

        /*
         * COD is considered payable until the
         * order is actually collected.
         *
         * We therefore create the payment as
         * PENDING rather than marking it PAID
         * at order creation.
         */
        const payment =
          await tx.payment.create({
            data: {
              orderId,

              paymentMethod:
                dto.paymentMethod,

              paymentStatus:
                PaymentStatus.PENDING,

              gateway,

              payableAmount:
                order.totalAmount,

              paidAmount:
                new Prisma.Decimal(0),

              refundedAmount:
                new Prisma.Decimal(0),

              currency:
                'INR',

              createdBy:
                userId,

              updatedBy:
                userId,
            },

            include:
              PAYMENT_WITH_TRANSACTIONS_INCLUDE,
          });

        /*
         * Create an initial transaction record.
         *
         * For Razorpay, the actual gateway order
         * will be attached later.
         *
         * For COD, this represents the pending
         * cash collection.
         */
        await tx.paymentTransaction.create({
          data: {
            paymentId:
              payment.id,

            gateway,

            transactionStatus:
              PaymentTransactionStatus.INITIATED,

            amount:
              order.totalAmount,

            currency:
              'INR',

            createdBy:
              userId,
          },
        });

        const result =
          await tx.payment.findUnique({
            where: {
              id: payment.id,
            },

            include:
              PAYMENT_WITH_TRANSACTIONS_INCLUDE,
          });

        if (!result) {
          throw new NotFoundException(
            'Payment could not be created',
          );
        }

        return PaymentsMapper.toResponse(
          result,
        );
      },
    );
  }

  async findByOrder(
    userId: string,
    orderId: string,
  ): Promise<PaymentResponseDto> {
    const payment =
      await this.prisma.payment.findFirst({
        where: {
          orderId,
          order: {
            userId,
            deletedAt: null,
          },
        },

        include:
          PAYMENT_WITH_TRANSACTIONS_INCLUDE,
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    return PaymentsMapper.toResponse(
      payment,
    );
  }

  async verifyRazorpayPayment(
    userId: string,
    paymentId: string,
    dto: VerifyPaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const payment =
          await tx.payment.findFirst({
            where: {
              id: paymentId,

              order: {
                userId,
                deletedAt: null,
              },
            },

            include:
              PAYMENT_WITH_TRANSACTIONS_INCLUDE,
          });

        if (!payment) {
          throw new NotFoundException(
            'Payment not found',
          );
        }

        if (
          payment.gateway !==
          PaymentGateway.RAZORPAY
        ) {
          throw new BadRequestException(
            'This payment does not use Razorpay',
          );
        }

        if (
          payment.paymentStatus ===
          PaymentStatus.PAID
        ) {
          return PaymentsMapper.toResponse(
            payment,
          );
        }

        /*
         * Signature verification will be performed
         * when the Razorpay gateway client is wired.
         *
         * We intentionally do not mark a payment
         * as PAID merely because the client supplied
         * these three strings.
         */
        const transaction =
          await tx.paymentTransaction.findFirst({
            where: {
              paymentId:
                payment.id,

              gateway:
                PaymentGateway.RAZORPAY,

              OR: [
                {
                  gatewayPaymentId:
                    dto.gatewayPaymentId,
                },
                {
                  gatewayPaymentId:
                    null,
                },
              ],
            },

            orderBy: {
              createdAt: 'desc',
            },
          });

        if (!transaction) {
          throw new NotFoundException(
            'Payment transaction not found',
          );
        }

        await tx.paymentTransaction.update({
          where: {
            id: transaction.id,
          },

          data: {
            gatewayOrderId:
              dto.gatewayOrderId,

            gatewayPaymentId:
              dto.gatewayPaymentId,

            gatewaySignature:
              dto.gatewaySignature,

            gatewayResponse: {
              gatewayOrderId:
                dto.gatewayOrderId,

              gatewayPaymentId:
                dto.gatewayPaymentId,
            },
          },
        });

        /*
         * Actual Razorpay signature verification
         * must happen before changing the payment
         * to PAID.
         *
         * Until the gateway client is configured,
         * leave the transaction INITIATED.
         */
        const updated =
          await tx.payment.findUnique({
            where: {
              id: payment.id,
            },

            include:
              PAYMENT_WITH_TRANSACTIONS_INCLUDE,
          });

        if (!updated) {
          throw new NotFoundException(
            'Payment not found after verification',
          );
        }

        return PaymentsMapper.toResponse(
          updated,
        );
      },
    );
  }

  async markCodAsPaid(
    userId: string,
    paymentId: string,
  ): Promise<PaymentResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const payment =
          await tx.payment.findFirst({
            where: {
              id: paymentId,

              paymentMethod:
                PaymentMethod.COD,

              order: {
                userId,
                deletedAt: null,
              },
            },

            include:
              PAYMENT_WITH_TRANSACTIONS_INCLUDE,
          });

        if (!payment) {
          throw new NotFoundException(
            'COD payment not found',
          );
        }

        if (
          payment.paymentStatus ===
          PaymentStatus.PAID
        ) {
          return PaymentsMapper.toResponse(
            payment,
          );
        }

        if (
          payment.paymentStatus !==
          PaymentStatus.PENDING
        ) {
          throw new ConflictException(
            `COD payment cannot be marked paid from ${payment.paymentStatus} status`,
          );
        }

        await tx.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            paymentStatus:
              PaymentStatus.PAID,

            paidAmount:
              payment.payableAmount,

            paidAt:
              new Date(),

            updatedBy:
              userId,
          },
        });

        await tx.paymentTransaction.create({
          data: {
            paymentId:
              payment.id,

            gateway:
              PaymentGateway.CASH,

            transactionStatus:
              PaymentTransactionStatus.SUCCESS,

            amount:
              payment.payableAmount,

            currency:
              payment.currency,

            processedAt:
              new Date(),

            createdBy:
              userId,
          },
        });

        await tx.order.update({
          where: {
            id: payment.orderId,
          },

          data: {
            paymentStatus:
              PaymentStatus.PAID,

            updatedBy:
              userId,
          },
        });

        const updated =
          await tx.payment.findUnique({
            where: {
              id: payment.id,
            },

            include:
              PAYMENT_WITH_TRANSACTIONS_INCLUDE,
          });

        if (!updated) {
          throw new NotFoundException(
            'Payment not found after update',
          );
        }

        return PaymentsMapper.toResponse(
          updated,
        );
      },
    );
  }

  async createRefund(
    userId: string,
    dto: CreateRefundDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const payment =
          await tx.payment.findFirst({
            where: {
              id: dto.paymentId,

              order: {
                userId,
                deletedAt: null,
              },
            },
          });

        if (!payment) {
          throw new NotFoundException(
            'Payment not found',
          );
        }

        if (
          payment.paymentStatus !==
            PaymentStatus.PAID &&
          payment.paymentStatus !==
            PaymentStatus.PARTIALLY_REFUNDED
        ) {
          throw new ConflictException(
            'Only paid payments can be refunded',
          );
        }

        const refundAmount =
          new Prisma.Decimal(dto.amount);

        const availableAmount =
          payment.paidAmount.sub(
            payment.refundedAmount,
          );

        if (
          refundAmount.greaterThan(
            availableAmount,
          )
        ) {
          throw new BadRequestException(
            'Refund amount exceeds the refundable amount',
          );
        }

        const refund =
          await tx.refund.create({
            data: {
              paymentId:
                payment.id,

              refundAmount,

              refundStatus:
                RefundStatus.PENDING,

              refundReason:
                dto.reason,

              createdBy:
                userId,

              updatedBy:
                userId,
            },
          });

        return {
          id: refund.id,
          paymentId:
            refund.paymentId,
          refundAmount:
            Number(refund.refundAmount),
          refundStatus:
            refund.refundStatus,
          refundReason:
            refund.refundReason,
          gatewayRefundId:
            refund.gatewayRefundId,
          refundedAt:
            refund.refundedAt,
          createdAt:
            refund.createdAt,
        };
      },
    );
  }
}
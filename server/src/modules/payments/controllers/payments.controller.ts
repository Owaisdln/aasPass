import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';

import { CurrentUser } from '../../../common/identity/current-user.model';

import { CreatePaymentDto } from '../dto/create-payment.dto';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';

import { PaymentsService } from '../services/payments.service';

@Controller('payments')
@UseGuards(SupabaseAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('orders/:orderId')
  async create(
    @AuthenticatedUser()
    currentUser: CurrentUser,

    @Param('orderId')
    orderId: string,

    @Body()
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.create(
      currentUser.id,
      orderId,
      dto,
    );
  }

  @Get('orders/:orderId')
  async findByOrder(
    @AuthenticatedUser()
    currentUser: CurrentUser,

    @Param('orderId')
    orderId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.findByOrder(
      currentUser.id,
      orderId,
    );
  }

  @Post(':paymentId/verify')
  async verifyRazorpayPayment(
    @AuthenticatedUser()
    currentUser: CurrentUser,

    @Param('paymentId')
    paymentId: string,

    @Body()
    dto: VerifyPaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.verifyRazorpayPayment(
      currentUser.id,
      paymentId,
      dto,
    );
  }

  @Patch(':paymentId/cod-paid')
  async markCodAsPaid(
    @AuthenticatedUser()
    currentUser: CurrentUser,

    @Param('paymentId')
    paymentId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.markCodAsPaid(
      currentUser.id,
      paymentId,
    );
  }

  @Post('refunds')
  async createRefund(
    @AuthenticatedUser()
    currentUser: CurrentUser,

    @Body()
    dto: CreateRefundDto,
  ) {
    return this.paymentsService.createRefund(
      currentUser.id,
      dto,
    );
  }
}
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';

import { CurrentUser } from '../../../common/identity/current-user.model';

import { CancelOrderDto } from '../dto/cancel-order.dto';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderResponseDto } from '../dto/order-response.dto';
import { OrdersService } from '../services/orders.service';

@Controller('orders')
@UseGuards(SupabaseAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  async create(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(
      currentUser.id,
      dto,
    );
  }

  @Get()
  async findAll(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.findAll(
      currentUser.id,
    );
  }

  @Get(':id')
  async findOne(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOne(
      currentUser.id,
      id,
    );
  }

  @Post(':id/cancel')
  async cancel(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
    @Body()
    dto: CancelOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.cancel(
      currentUser.id,
      id,
      dto.reason,
    );
  }
}
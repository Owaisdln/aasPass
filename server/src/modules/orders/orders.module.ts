import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { CartController } from './controllers/cart.controller';
import { OrdersController } from './controllers/orders.controller';
import { OrdersMapper } from './mappers/orders.mapper';
import { CartService } from './services/cart.service';
import { OrdersService } from './services/orders.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    CartController,
    OrdersController,
  ],
  providers: [
    CartService,
    OrdersService,
    OrdersMapper,
  ],
  exports: [
    CartService,
    OrdersService,
  ],
})
export class OrdersModule {}
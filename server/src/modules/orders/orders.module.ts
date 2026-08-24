import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { OrdersController } from './controllers/orders.controller';
import { OrdersMapper } from './mappers/orders.mapper';
import { OrdersService } from './services/orders.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    OrdersController,
  ],
  providers: [
    OrdersService,
    OrdersMapper,
  ],
  exports: [
    OrdersService,
  ],
})
export class OrdersModule {}
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { PaymentsController } from './controllers/payments.controller';
import { PaymentsMapper } from './mappers/payments.mapper';
import { PaymentsService } from './services/payments.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    PaymentsController,
  ],
  providers: [
    PaymentsService,
    PaymentsMapper,
  ],
  exports: [
    PaymentsService,
  ],
})
export class PaymentsModule {}
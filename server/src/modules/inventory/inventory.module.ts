import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { InventoryController } from './controllers/inventory.controller';
import { InventoryMapper } from './mappers/inventory.mapper';
import { InventoryService } from './services/inventory.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    InventoryController,
  ],
  providers: [
    InventoryService,
    InventoryMapper,
  ],
  exports: [
    InventoryService,
  ],
})
export class InventoryModule {}
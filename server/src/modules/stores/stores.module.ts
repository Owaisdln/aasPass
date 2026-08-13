import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { StoresController } from './controllers/stores.controller';
import { StoreHoursController } from './controllers/hours/store-hours.controller';
import { StoreDeliverySettingsController } from './controllers/delivery-settings/store-delivery-settings.controller';
import { StoreImagesController } from './controllers/images/store-images.controller';

import { StoreMapper } from './mappers/store.mapper';

import { StoresService } from './services/stores.service';
import { StoreHoursService } from './services/hours/store-hours.service';
import { StoreDeliverySettingsService } from './services/delivery-settings/store-delivery-settings.service';
import { StoreImagesService } from './services/images/store-images.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    StoresController,
    StoreHoursController,
    StoreDeliverySettingsController,
    StoreImagesController,
  ],
  providers: [
    StoresService,
    StoreHoursService,
    StoreDeliverySettingsService,
    StoreImagesService,
    StoreMapper,
  ],
})
export class StoresModule {}
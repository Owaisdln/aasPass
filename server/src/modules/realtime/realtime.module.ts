import { Module } from '@nestjs/common';

import { CatalogUpdatesGateway } from './catalog-updates.gateway';

@Module({
  providers: [CatalogUpdatesGateway],
  exports: [CatalogUpdatesGateway],
})
export class RealtimeModule {}

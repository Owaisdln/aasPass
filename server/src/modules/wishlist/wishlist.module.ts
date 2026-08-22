import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { WishlistController } from './controllers/wishlist.controller';
import { WishlistMapper } from './mappers/wishlist.mapper';
import { WishlistService } from './services/wishlist.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    WishlistController,
  ],
  providers: [
    WishlistService,
    WishlistMapper,
  ],
  exports: [
    WishlistService,
  ],
})
export class WishlistModule {}
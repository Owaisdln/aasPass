import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { CategoriesController } from './categories/controllers/categories.controller';
import { CategoriesService } from './categories/services/categories.service';
import { CategoryMapper } from './categories/mappers/category.mapper';

import { BrandsController } from './brands/controllers/brands.controller';
import { BrandsService } from './brands/services/brands.service';
import { BrandMapper } from './brands/mappers/brand.mapper';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    CategoriesController,
    BrandsController,
  ],
  providers: [
    CategoriesService,
    CategoryMapper,
    BrandsService,
    BrandMapper,
  ],
})
export class CatalogModule {}
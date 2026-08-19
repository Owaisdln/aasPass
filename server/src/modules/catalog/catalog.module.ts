import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { CategoriesController } from './categories/controllers/categories.controller';
import { CategoriesService } from './categories/services/categories.service';
import { CategoryMapper } from './categories/mappers/category.mapper';

import { BrandsController } from './brands/controllers/brands.controller';
import { BrandsService } from './brands/services/brands.service';
import { BrandMapper } from './brands/mappers/brand.mapper';

import { UnitsController } from './units/controllers/units.controller';
import { UnitsService } from './units/services/units.service';
import { UnitMapper } from './units/mappers/unit.mapper';

import { MasterProductsController } from './master-products/controllers/master-products.controller';
import { MasterProductsService } from './master-products/services/master-products.service';
import { MasterProductMapper } from './master-products/mappers/master-product.mapper';

import { ProductImagesController } from './product-images/controllers/product-images.controller';
import { ProductImagesService } from './product-images/services/product-images.service';
import { ProductImageMapper } from './product-images/mappers/product-image.mapper';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    CategoriesController,
    BrandsController,
    UnitsController,
    MasterProductsController,
    ProductImagesController,
  ],
  providers: [
    CategoriesService,
    CategoryMapper,

    BrandsService,
    BrandMapper,

    UnitsService,
    UnitMapper,

    MasterProductsService,
    MasterProductMapper,

    ProductImagesService,
    ProductImageMapper,
  ],
})
export class CatalogModule {}
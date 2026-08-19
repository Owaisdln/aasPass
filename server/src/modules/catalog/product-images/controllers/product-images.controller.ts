import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../../auth/guards/supabase-auth.guard';

import { CurrentUser } from '../../../../common/identity/current-user.model';

import { CreateProductImageDto } from '../dto/create-product-image.dto';
import { UpdateProductImageDto } from '../dto/update-product-image.dto';
import { ProductImageResponseDto } from '../dto/product-image-response.dto';
import { ProductImagesService } from '../services/product-images.service';

@Controller('catalog/product-images')
@UseGuards(SupabaseAuthGuard)
export class ProductImagesController {
  constructor(
    private readonly productImagesService: ProductImagesService,
  ) {}

  @Post()
  async create(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    return this.productImagesService.create(
      currentUser.id,
      dto,
    );
  }

  @Get('product/:masterProductId')
  async findByProduct(
    @Param('masterProductId')
    masterProductId: string,
  ): Promise<ProductImageResponseDto[]> {
    return this.productImagesService.findByProduct(
      masterProductId,
    );
  }

  @Get(':id')
  async findById(
    @Param('id')
    id: string,
  ): Promise<ProductImageResponseDto> {
    return this.productImagesService.findById(
      id,
    );
  }

  @Patch(':id')
  async update(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
    @Body()
    dto: UpdateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    return this.productImagesService.update(
      currentUser.id,
      id,
      dto,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id')
    id: string,
  ): Promise<void> {
    return this.productImagesService.remove(id);
  }
}
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

import { CreateStoreProductDto } from '../dto/create-store-product.dto';
import { UpdateStoreProductDto } from '../dto/update-store-product.dto';
import { StoreProductResponseDto } from '../dto/store-product-response.dto';
import { StoreProductsService } from '../services/store-products.service';

@Controller('catalog/store-products')
@UseGuards(SupabaseAuthGuard)
export class StoreProductsController {
  constructor(
    private readonly storeProductsService: StoreProductsService,
  ) {}

  @Post('me')
  async create(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateStoreProductDto,
  ): Promise<StoreProductResponseDto> {
    return this.storeProductsService.create(
      currentUser.id,
      dto,
    );
  }

  @Get('me')
  async findMine(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<StoreProductResponseDto[]> {
    return this.storeProductsService.findMine(
      currentUser.id,
    );
  }

  @Get('me/:id')
  async findMineById(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<StoreProductResponseDto> {
    return this.storeProductsService.findMineById(
      currentUser.id,
      id,
    );
  }

  @Patch('me/:id')
  async update(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
    @Body()
    dto: UpdateStoreProductDto,
  ): Promise<StoreProductResponseDto> {
    return this.storeProductsService.update(
      currentUser.id,
      id,
      dto,
    );
  }

  @Delete('me/:id')
  async remove(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<void> {
    return this.storeProductsService.remove(
      currentUser.id,
      id,
    );
  }
}
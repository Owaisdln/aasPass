import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';

import { CurrentUser } from '../../../common/identity/current-user.model';

import { CreateStoreDto } from '../dto/create-store.dto';
import { StoreResponseDto } from '../dto/store-response.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { StoresService } from '../services/stores.service';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
  ) {}

  /** Public — no auth needed: browse all active stores */
  @Get('browse')
  async browse() {
    return this.storesService.browseStores();
  }

  /** Public — no auth needed: list products for a store */
  @Get(':storeId/products')
  async getProducts(@Param('storeId') storeId: string) {
    return this.storesService.getStoreProducts(storeId);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  async createStore(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateStoreDto,
  ): Promise<StoreResponseDto> {
    return this.storesService.createStore(
      currentUser.id,
      dto,
    );
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMyStore(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<StoreResponseDto> {
    return this.storesService.getMyStore(
      currentUser.id,
    );
  }

  @Patch('me')
  @UseGuards(SupabaseAuthGuard)
  async updateStore(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    return this.storesService.updateStore(
      currentUser.id,
      dto,
    );
  }
}
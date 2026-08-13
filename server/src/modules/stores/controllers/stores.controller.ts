import {
  Body,
  Controller,
  Get,
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
@UseGuards(SupabaseAuthGuard)
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
  ) {}

  @Post()
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
  async getMyStore(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<StoreResponseDto> {
    return this.storesService.getMyStore(
      currentUser.id,
    );
  }

  @Patch('me')
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
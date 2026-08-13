import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../../auth/guards/supabase-auth.guard';

import { CurrentUser } from '../../../../common/identity/current-user.model';

import { StoreDeliverySettingsResponseDto } from '../../dto/delivery-settings/store-delivery-settings-response.dto';
import { UpdateStoreDeliverySettingsDto } from '../../dto/delivery-settings/update-store-delivery-settings.dto';
import { StoreDeliverySettingsService } from '../../services/delivery-settings/store-delivery-settings.service';

@Controller('stores/me/delivery-settings')
@UseGuards(SupabaseAuthGuard)
export class StoreDeliverySettingsController {
  constructor(
    private readonly storeDeliverySettingsService: StoreDeliverySettingsService,
  ) {}

  @Get()
  async getMyDeliverySettings(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<StoreDeliverySettingsResponseDto> {
    return this.storeDeliverySettingsService.getMyDeliverySettings(
      currentUser.id,
    );
  }

  @Patch()
  async updateMyDeliverySettings(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: UpdateStoreDeliverySettingsDto,
  ): Promise<StoreDeliverySettingsResponseDto> {
    return this.storeDeliverySettingsService.updateMyDeliverySettings(
      currentUser.id,
      dto,
    );
  }
}
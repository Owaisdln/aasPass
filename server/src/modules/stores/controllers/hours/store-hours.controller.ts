import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../../auth/guards/supabase-auth.guard';

import { CurrentUser } from '../../../../common/identity/current-user.model';

import { StoreHourResponseDto } from '../../dto/hours/store-hour-response.dto';
import { UpdateStoreHoursDto } from '../../dto/hours/update-store-hours.dto';
import { StoreHoursService } from '../../services/hours/store-hours.service';

@Controller('stores/me/hours')
@UseGuards(SupabaseAuthGuard)
export class StoreHoursController {
  constructor(
    private readonly storeHoursService: StoreHoursService,
  ) {}

  @Get()
  async getMyHours(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<StoreHourResponseDto[]> {
    return this.storeHoursService.getMyHours(
      currentUser.id,
    );
  }

  @Put()
  async updateMyHours(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: UpdateStoreHoursDto,
  ): Promise<StoreHourResponseDto[]> {
    return this.storeHoursService.updateMyHours(
      currentUser.id,
      dto,
    );
  }
}
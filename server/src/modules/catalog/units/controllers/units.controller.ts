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

import { CreateUnitDto } from '../dto/create-unit.dto';
import { UpdateUnitDto } from '../dto/update-unit.dto';
import { UnitResponseDto } from '../dto/unit-response.dto';
import { UnitsService } from '../services/units.service';

@Controller('catalog/units')
@UseGuards(SupabaseAuthGuard)
export class UnitsController {
  constructor(
    private readonly unitsService: UnitsService,
  ) {}

  @Post()
  async create(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateUnitDto,
  ): Promise<UnitResponseDto> {
    return this.unitsService.create(
      currentUser.id,
      dto,
    );
  }

  @Get()
  async findAll(): Promise<UnitResponseDto[]> {
    return this.unitsService.findAll();
  }

  @Get(':id')
  async findById(
    @Param('id')
    id: string,
  ): Promise<UnitResponseDto> {
    return this.unitsService.findById(id);
  }

  @Patch(':id')
  async update(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
    @Body()
    dto: UpdateUnitDto,
  ): Promise<UnitResponseDto> {
    return this.unitsService.update(
      currentUser.id,
      id,
      dto,
    );
  }

  @Delete(':id')
  async remove(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<void> {
    return this.unitsService.remove(
      currentUser.id,
      id,
    );
  }
}
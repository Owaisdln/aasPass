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

import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { BrandResponseDto } from '../dto/brand-response.dto';
import { BrandsService } from '../services/brands.service';

@Controller('catalog/brands')
@UseGuards(SupabaseAuthGuard)
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
  ) {}

  @Post()
  async create(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateBrandDto,
  ): Promise<BrandResponseDto> {
    return this.brandsService.create(
      currentUser.id,
      dto,
    );
  }

  @Get()
  async findAll(): Promise<BrandResponseDto[]> {
    return this.brandsService.findAll();
  }

  @Get(':id')
  async findById(
    @Param('id')
    id: string,
  ): Promise<BrandResponseDto> {
    return this.brandsService.findById(id);
  }

  @Patch(':id')
  async update(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
    @Body()
    dto: UpdateBrandDto,
  ): Promise<BrandResponseDto> {
    return this.brandsService.update(
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
    return this.brandsService.remove(
      currentUser.id,
      id,
    );
  }
}
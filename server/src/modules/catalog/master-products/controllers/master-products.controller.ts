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

import { CreateMasterProductDto } from '../dto/create-master-product.dto';
import { UpdateMasterProductDto } from '../dto/update-master-product.dto';
import { MasterProductResponseDto } from '../dto/master-product-response.dto';
import { MasterProductsService } from '../services/master-products.service';

@Controller('catalog/master-products')
@UseGuards(SupabaseAuthGuard)
export class MasterProductsController {
  constructor(
    private readonly masterProductsService: MasterProductsService,
  ) {}

  @Post()
  async create(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateMasterProductDto,
  ): Promise<MasterProductResponseDto> {
    return this.masterProductsService.create(
      currentUser.id,
      dto,
    );
  }

  @Get()
  async findAll(): Promise<
    MasterProductResponseDto[]
  > {
    return this.masterProductsService.findAll();
  }

  @Get(':id')
  async findById(
    @Param('id')
    id: string,
  ): Promise<MasterProductResponseDto> {
    return this.masterProductsService.findById(
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
    dto: UpdateMasterProductDto,
  ): Promise<MasterProductResponseDto> {
    return this.masterProductsService.update(
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
    return this.masterProductsService.remove(
      currentUser.id,
      id,
    );
  }
}
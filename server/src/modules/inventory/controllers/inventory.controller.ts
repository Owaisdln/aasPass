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

import { CreateInventoryDto } from '../dto/create-inventory.dto';
import { UpdateInventoryDto } from '../dto/update-inventory.dto';
import { AdjustInventoryDto } from '../dto/adjust-inventory.dto';
import { InventoryResponseDto } from '../dto/inventory-response.dto';
import { InventoryTransactionResponseDto } from '../dto/inventory-transaction-response.dto';
import { InventoryService } from '../services/inventory.service';

@Controller('inventory/me')
@UseGuards(SupabaseAuthGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @Post()
  async create(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateInventoryDto,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.create(
      currentUser.id,
      dto,
    );
  }

  @Get()
  async findAll(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<InventoryResponseDto[]> {
    return this.inventoryService.findAll(
      currentUser.id,
    );
  }

  @Get(':id')
  async findOne(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.findOne(
      currentUser.id,
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
    dto: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.update(
      currentUser.id,
      id,
      dto,
    );
  }

  @Post(':id/adjust')
  async adjustStock(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
    @Body()
    dto: AdjustInventoryDto,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.adjustStock(
      currentUser.id,
      id,
      dto,
    );
  }

  @Get(':id/transactions')
  async getTransactions(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<InventoryTransactionResponseDto[]> {
    return this.inventoryService.getTransactions(
      currentUser.id,
      id,
    );
  }
}
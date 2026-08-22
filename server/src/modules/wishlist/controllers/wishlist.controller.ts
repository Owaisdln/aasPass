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

import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';

import { CurrentUser } from '../../../common/identity/current-user.model';

import { AddWishlistItemDto } from '../dto/add-wishlist-item.dto';
import { CreateWishlistDto } from '../dto/create-wishlist.dto';
import { UpdateWishlistDto } from '../dto/update-wishlist.dto';
import { WishlistItemResponseDto } from '../dto/wishlist-item-response.dto';
import { WishlistResponseDto } from '../dto/wishlist-response.dto';
import { WishlistService } from '../services/wishlist.service';

@Controller('wishlists')
@UseGuards(SupabaseAuthGuard)
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
  ) {}

  @Post()
  async create(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.create(
      currentUser.id,
      dto,
    );
  }

  @Get()
  async findAll(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<WishlistResponseDto[]> {
    return this.wishlistService.findAll(
      currentUser.id,
    );
  }

  @Get(':id')
  async findOne(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.findOne(
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
    dto: UpdateWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.update(
      currentUser.id,
      id,
      dto,
    );
  }

  @Patch(':id/default')
  async setDefault(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.setDefault(
      currentUser.id,
      id,
    );
  }

  @Delete(':id')
  async remove(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<void> {
    return this.wishlistService.remove(
      currentUser.id,
      id,
    );
  }

  @Post(':id/items')
  async addItem(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
    @Body()
    dto: AddWishlistItemDto,
  ): Promise<WishlistItemResponseDto> {
    return this.wishlistService.addItem(
      currentUser.id,
      id,
      dto,
    );
  }

  @Delete(':id/items/:itemId')
  async removeItem(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
    @Param('itemId')
    itemId: string,
  ): Promise<void> {
    return this.wishlistService.removeItem(
      currentUser.id,
      id,
      itemId,
    );
  }

  @Delete(':id/items')
  async clear(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('id')
    id: string,
  ): Promise<void> {
    return this.wishlistService.clear(
      currentUser.id,
      id,
    );
  }
}
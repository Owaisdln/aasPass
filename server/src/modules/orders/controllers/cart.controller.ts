import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/identity/current-user.model';

import { UpsertCartItemDto } from '../dto/upsert-cart-item.dto';
import { CartResponseDto } from '../dto/cart-response.dto';
import { CartService } from '../services/cart.service';

@Controller('carts')
@UseGuards(SupabaseAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /** GET /carts — return the authenticated user's active cart */
  @Get()
  async getMyCart(
    @AuthenticatedUser() currentUser: CurrentUser,
  ): Promise<CartResponseDto | null> {
    return this.cartService.getMyCart(currentUser.id);
  }

  /** PUT /carts/items — add / update / remove (qty=0) a product */
  @Put('items')
  async upsertItem(
    @AuthenticatedUser() currentUser: CurrentUser,
    @Body() dto: UpsertCartItemDto,
  ): Promise<CartResponseDto | null> {
    return this.cartService.upsertItem(currentUser.id, dto);
  }

  /** DELETE /carts — abandon (clear) the whole cart */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(
    @AuthenticatedUser() currentUser: CurrentUser,
  ): Promise<void> {
    return this.cartService.clearCart(currentUser.id);
  }
}

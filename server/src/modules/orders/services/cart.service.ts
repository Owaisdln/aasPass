import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CartStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CartResponseDto, CartItemResponseDto } from '../dto/cart-response.dto';
import { UpsertCartItemDto } from '../dto/upsert-cart-item.dto';

const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' as const },
  },
};

function mapCart(cart: any): CartResponseDto {
  return {
    id: cart.id,
    userId: cart.userId,
    storeId: cart.storeId,
    status: cart.status,
    subtotal: Number(cart.subtotal),
    discountAmount: Number(cart.discountAmount),
    taxAmount: Number(cart.taxAmount),
    deliveryFee: Number(cart.deliveryFee),
    totalAmount: Number(cart.totalAmount),
    items: (cart.items ?? []).map((item: any): CartItemResponseDto => ({
      id: item.id,
      storeProductId: item.storeProductId,
      quantity: item.quantity,
      productNameSnapshot: item.productNameSnapshot,
      unitSnapshot: item.unitSnapshot,
      mrpSnapshot: Number(item.mrpSnapshot),
      sellingPriceSnapshot: Number(item.sellingPriceSnapshot),
      gstRateSnapshot: Number(item.gstRateSnapshot),
      subtotal: Number(item.subtotal),
    })),
  };
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get or return null for active cart */
  async getMyCart(userId: string): Promise<CartResponseDto | null> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE, deletedAt: null },
      include: CART_INCLUDE,
    });
    return cart ? mapCart(cart) : null;
  }

  /** Add or update a product in the cart. quantity=0 removes it. */
  async upsertItem(
    userId: string,
    dto: UpsertCartItemDto,
  ): Promise<CartResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      // Validate storeProduct exists and is available
      const storeProduct = await tx.storeProduct.findFirst({
        where: {
          id: dto.storeProductId,
          deletedAt: null,
          availabilityStatus: 'AVAILABLE',
        },
        include: {
          masterProduct: { include: { unit: true } },
          inventory: true,
        },
      });

      if (!storeProduct) {
        throw new NotFoundException('Product not found or unavailable');
      }

      if (storeProduct.masterProduct.deletedAt) {
        throw new ConflictException('Product is no longer available');
      }

      // Stock check when adding
      if (dto.quantity > 0 && storeProduct.trackInventory) {
        const stock = storeProduct.inventory?.stockQuantity ?? 0;
        if (dto.quantity > stock) {
          throw new ConflictException(
            `Only ${stock} unit(s) available for ${storeProduct.masterProduct.name}`,
          );
        }
      }

      // Find or create active cart for this store
      let cart = await tx.cart.findFirst({
        where: {
          userId,
          storeId: storeProduct.storeId,
          status: CartStatus.ACTIVE,
          deletedAt: null,
        },
        include: CART_INCLUDE,
      });

      if (!cart) {
        // Check if user has an active cart for a DIFFERENT store
        const otherCart = await tx.cart.findFirst({
          where: { userId, status: CartStatus.ACTIVE, deletedAt: null },
        });
        if (otherCart) {
          throw new ConflictException(
            'You already have items from a different store. Clear your cart first.',
          );
        }

        cart = await tx.cart.create({
          data: {
            userId,
            storeId: storeProduct.storeId,
            status: CartStatus.ACTIVE,
            createdBy: userId,
            updatedBy: userId,
          },
          include: CART_INCLUDE,
        });
      }

      const itemSubtotal = new Prisma.Decimal(storeProduct.sellingPrice).mul(
        dto.quantity,
      );

      if (dto.quantity === 0) {
        // Remove item
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id, storeProductId: dto.storeProductId },
        });
      } else {
        // Upsert item
        const existing = await tx.cartItem.findUnique({
          where: { cartId_storeProductId: { cartId: cart.id, storeProductId: dto.storeProductId } },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: {
              quantity: dto.quantity,
              sellingPriceSnapshot: storeProduct.sellingPrice,
              mrpSnapshot: storeProduct.mrp,
              gstRateSnapshot: storeProduct.masterProduct.gstRate,
              subtotal: itemSubtotal,
              updatedBy: userId,
            },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              storeProductId: dto.storeProductId,
              quantity: dto.quantity,
              productNameSnapshot: storeProduct.masterProduct.name,
              unitSnapshot: `${storeProduct.masterProduct.unitValue} ${storeProduct.masterProduct.unit.symbol}`,
              mrpSnapshot: storeProduct.mrp,
              sellingPriceSnapshot: storeProduct.sellingPrice,
              gstRateSnapshot: storeProduct.masterProduct.gstRate,
              subtotal: itemSubtotal,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
      }

      // Recalculate cart totals
      const allItems = await tx.cartItem.findMany({ where: { cartId: cart.id } });

      if (allItems.length === 0) {
        // Empty cart — soft-delete it
        await tx.cart.update({
          where: { id: cart.id },
          data: { status: CartStatus.ABANDONED, updatedBy: userId },
        });
        return mapCart({ ...cart, items: [], subtotal: 0, discountAmount: 0, taxAmount: 0, deliveryFee: 0, totalAmount: 0 });
      }

      const newSubtotal = allItems.reduce(
        (sum, item) => sum.add(new Prisma.Decimal(item.subtotal)),
        new Prisma.Decimal(0),
      );

      const newTax = allItems.reduce(
        (sum, item) =>
          sum.add(
            new Prisma.Decimal(item.sellingPriceSnapshot)
              .mul(item.quantity)
              .mul(new Prisma.Decimal(item.gstRateSnapshot))
              .div(100),
          ),
        new Prisma.Decimal(0),
      );

      const updatedCart = await tx.cart.update({
        where: { id: cart.id },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTax,
          totalAmount: newSubtotal.add(newTax),
          updatedBy: userId,
        },
        include: CART_INCLUDE,
      });

      return mapCart(updatedCart);
    });
  }

  /** Clear all items — abandons the cart */
  async clearCart(userId: string): Promise<void> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE, deletedAt: null },
    });
    if (!cart) return;

    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      this.prisma.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.ABANDONED, updatedBy: userId },
      }),
    ]);
  }
}

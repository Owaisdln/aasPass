import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CartStatus,
  FulfillmentStatus,
  FulfillmentType,
  InventoryReferenceType,
  InventoryTransactionType,
  OrderStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderResponseDto } from '../dto/order-response.dto';
import { OrdersMapper } from '../mappers/orders.mapper';
import {
  ORDER_WITH_ITEMS_INCLUDE,
} from '../types/orders.types';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const cart = await tx.cart.findFirst({
          where: {
            userId,
            status: CartStatus.ACTIVE,
            deletedAt: null,
            items: {
              some: {},
            },
          },
          include: {
            items: {
              orderBy: {
                createdAt: 'asc',
              },
            },
            store: true,
          },
        });

        if (!cart) {
          throw new BadRequestException(
            'Active cart with items not found',
          );
        }

        if (!cart.items.length) {
          throw new BadRequestException(
            'Cannot create an order from an empty cart',
          );
        }

        if (!cart.store || cart.store.deletedAt) {
          throw new BadRequestException(
            'The selected store is no longer available',
          );
        }

        const address =
          await tx.address.findFirst({
            where: {
              id: dto.addressId,
              userId,
              deletedAt: null,
            },
          });

        if (!address) {
          throw new NotFoundException(
            'Delivery address not found',
          );
        }

        const deliverySettings =
          await tx.storeDeliverySetting.findUnique({
            where: {
              storeId: cart.storeId,
            },
          });

        if (
          dto.fulfillmentType ===
            FulfillmentType.DELIVERY &&
          deliverySettings &&
          !deliverySettings.isDeliveryAvailable
        ) {
          throw new BadRequestException(
            'Delivery is not available for this store',
          );
        }

        if (
          dto.fulfillmentType ===
            FulfillmentType.PICKUP &&
          deliverySettings &&
          !deliverySettings.isPickupAvailable
        ) {
          throw new BadRequestException(
            'Pickup is not available for this store',
          );
        }

        const cartSubtotal =
          new Prisma.Decimal(cart.subtotal);

        if (
          deliverySettings &&
          cartSubtotal.lessThan(
            deliverySettings.minimumOrderAmount,
          )
        ) {
          throw new BadRequestException(
            `Minimum order amount is ${deliverySettings.minimumOrderAmount.toString()}`,
          );
        }

        const storeProductIds =
          cart.items.map(
            (item) => item.storeProductId,
          );

        const storeProducts =
          await tx.storeProduct.findMany({
            where: {
              id: {
                in: storeProductIds,
              },
              storeId: cart.storeId,
              deletedAt: null,
            },
            include: {
              masterProduct: true,
              inventory: true,
            },
          });

        if (
          storeProducts.length !==
          storeProductIds.length
        ) {
          throw new ConflictException(
            'One or more products in the cart are no longer available',
          );
        }

        const storeProductMap =
          new Map(
            storeProducts.map(
              (product) => [
                product.id,
                product,
              ],
            ),
          );

        let subtotal =
          new Prisma.Decimal(0);

        let taxAmount =
          new Prisma.Decimal(0);

        const orderItems =
          cart.items.map((cartItem) => {
            const storeProduct =
              storeProductMap.get(
                cartItem.storeProductId,
              );

            if (!storeProduct) {
              throw new ConflictException(
                `Product ${cartItem.storeProductId} is no longer available`,
              );
            }

            if (
              storeProduct.masterProduct
                .deletedAt
            ) {
              throw new ConflictException(
                `${cartItem.productNameSnapshot} is no longer available`,
              );
            }

            if (
              storeProduct.availabilityStatus !==
              'AVAILABLE'
            ) {
              throw new ConflictException(
                `${cartItem.productNameSnapshot} is no longer available`,
              );
            }

            const itemSubtotal =
              new Prisma.Decimal(
                cartItem.sellingPriceSnapshot,
              ).mul(cartItem.quantity);

            const itemTax =
              itemSubtotal
                .mul(cartItem.gstRateSnapshot)
                .div(100);

            subtotal =
              subtotal.add(itemSubtotal);

            taxAmount =
              taxAmount.add(itemTax);

            return {
              storeProductId:
                cartItem.storeProductId,

              quantity:
                cartItem.quantity,

              productNameSnapshot:
                cartItem.productNameSnapshot,

              unitSnapshot:
                cartItem.unitSnapshot,

              mrpSnapshot:
                cartItem.mrpSnapshot,

              sellingPriceSnapshot:
                cartItem.sellingPriceSnapshot,

              gstRateSnapshot:
                cartItem.gstRateSnapshot,

              subtotal:
                itemSubtotal,

              fulfillmentStatus:
                FulfillmentStatus.PENDING,

              createdBy:
                userId,

              updatedBy:
                userId,
            };
          });

        /*
         * Inventory deduction
         *
         * We do this inside the SAME transaction
         * as order creation.
         *
         * The schema does not have RESERVE/RELEASE
         * transaction types, so v1 uses SALE when
         * stock is consumed by an order.
         */
        for (const cartItem of cart.items) {
          const storeProduct =
            storeProductMap.get(
              cartItem.storeProductId,
            );

          if (!storeProduct) {
            throw new ConflictException(
              'Store product is no longer available',
            );
          }

          if (!storeProduct.trackInventory) {
            continue;
          }

          const inventory =
            storeProduct.inventory;

          if (!inventory) {
            throw new ConflictException(
              `Inventory is not configured for ${cartItem.productNameSnapshot}`,
            );
          }

          const requiredQuantity =
            cartItem.quantity;

          if (
            inventory.stockQuantity <
            requiredQuantity
          ) {
            throw new ConflictException(
              `Insufficient stock for ${cartItem.productNameSnapshot}`,
            );
          }

          const newStockQuantity =
            inventory.stockQuantity -
            requiredQuantity;

          const updatedInventory =
            await tx.inventory.updateMany({
              where: {
                id: inventory.id,

                version:
                  inventory.version,

                stockQuantity: {
                  gte: requiredQuantity,
                },
              },

              data: {
                stockQuantity: {
                  decrement:
                    requiredQuantity,
                },

                version: {
                  increment: 1,
                },

                lastStockUpdate:
                  new Date(),

                updatedBy:
                  userId,
              },
            });

          if (
            updatedInventory.count !== 1
          ) {
            throw new ConflictException(
              `Stock changed while placing the order for ${cartItem.productNameSnapshot}. Please try again.`,
            );
          }

          await tx.inventoryTransaction.create({
            data: {
              inventoryId:
                inventory.id,

              transactionType:
                InventoryTransactionType.SALE,

              quantity:
                requiredQuantity,

              balanceAfterTransaction:
                newStockQuantity,

              referenceType:
                InventoryReferenceType.ORDER,

              source:
                'ORDER_PLACEMENT',

              notes:
                `Stock consumed for order placement`,

              createdBy:
                userId,
            },
          });
        }

        const discountAmount =
          new Prisma.Decimal(0);

        let deliveryFee =
          new Prisma.Decimal(0);

        if (
          dto.fulfillmentType ===
          FulfillmentType.DELIVERY
        ) {
          if (
            deliverySettings &&
            deliverySettings.freeDeliveryAbove !==
              null &&
            subtotal.greaterThanOrEqualTo(
              deliverySettings.freeDeliveryAbove,
            )
          ) {
            deliveryFee =
              new Prisma.Decimal(0);
          } else if (deliverySettings) {
            deliveryFee =
              new Prisma.Decimal(
                deliverySettings.deliveryCharge,
              );
          }
        }

        const totalAmount =
          subtotal
            .sub(discountAmount)
            .add(taxAmount)
            .add(deliveryFee);

        const orderNumber =
          await this.generateOrderNumber(tx);

        const order =
          await tx.order.create({
            data: {
              userId,

              storeId:
                cart.storeId,

              addressId:
                address.id,

              orderNumber,

              status:
                OrderStatus.PENDING,

              fulfillmentType:
                dto.fulfillmentType,

              subtotal,

              discountAmount,

              taxAmount,

              deliveryFee,

              totalAmount,

              deliveryReceiverName:
                address.receiverName,

              deliveryPhone:
                address.receiverPhone,

              deliveryEmail:
                null,

              deliveryHouseNo:
                address.houseNo,

              deliveryStreet:
                address.street ?? '',

              deliveryArea:
                address.area,

              deliveryLandmark:
                address.landmark,

              deliveryCity:
                address.city,

              deliveryState:
                address.state,

              deliveryCountry:
                address.country,

              deliveryPincode:
                address.pincode,

              deliveryLatitude:
                address.latitude,

              deliveryLongitude:
                address.longitude,

              deliveryInstructions:
                dto.notes,

              createdBy:
                userId,

              updatedBy:
                userId,

              items: {
                create:
                  orderItems,
              },

              statusHistory: {
                create: {
                  previousStatus:
                    null,

                  newStatus:
                    OrderStatus.PENDING,

                  remarks:
                    'Order placed',

                  createdBy:
                    userId,
                },
              },
            },

            include:
              ORDER_WITH_ITEMS_INCLUDE,
          });

        await tx.cart.update({
          where: {
            id: cart.id,
          },

          data: {
            status:
              CartStatus.CHECKED_OUT,

            updatedBy:
              userId,
          },
        });

        return OrdersMapper.toResponse(
          order,
        );
      },
    );
  }

  async findAll(
    userId: string,
  ): Promise<OrderResponseDto[]> {
    const orders =
      await this.prisma.order.findMany({
        where: {
          userId,
          deletedAt: null,
        },

        include:
          ORDER_WITH_ITEMS_INCLUDE,

        orderBy: {
          placedAt: 'desc',
        },
      });

    return orders.map(
      OrdersMapper.toResponse,
    );
  }

  async findOne(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          deletedAt: null,
        },

        include:
          ORDER_WITH_ITEMS_INCLUDE,
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return OrdersMapper.toResponse(
      order,
    );
  }

  async cancel(
    userId: string,
    orderId: string,
    reason?: string,
  ): Promise<OrderResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findFirst({
            where: {
              id: orderId,
              userId,
              deletedAt: null,
            },

            include: {
              ...ORDER_WITH_ITEMS_INCLUDE,

              items: {
                ...ORDER_WITH_ITEMS_INCLUDE.items,

                include: {
                  storeProduct: {
                    include: {
                      inventory: true,
                    },
                  },
                },
              },
            },
          });

        if (!order) {
          throw new NotFoundException(
            'Order not found',
          );
        }

        const cancellableStatuses:
          OrderStatus[] = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
          ];

        if (
          !cancellableStatuses.includes(
            order.status,
          )
        ) {
          throw new ConflictException(
            `Order cannot be cancelled from ${order.status} status`,
          );
        }

        /*
         * Restore inventory for tracked products.
         *
         * The order transaction and inventory
         * restoration happen atomically.
         */
        for (const orderItem of order.items) {
          const storeProduct =
            orderItem.storeProduct;

          if (!storeProduct) {
            continue;
          }

          if (!storeProduct.trackInventory) {
            continue;
          }

          const inventory =
            storeProduct.inventory;

          if (!inventory) {
            continue;
          }

          const updatedInventory =
            await tx.inventory.updateMany({
              where: {
                id:
                  inventory.id,

                version:
                  inventory.version,
              },

              data: {
                stockQuantity: {
                  increment:
                    orderItem.quantity,
                },

                version: {
                  increment: 1,
                },

                lastStockUpdate:
                  new Date(),

                updatedBy:
                  userId,
              },
            });

          if (
            updatedInventory.count !== 1
          ) {
            throw new ConflictException(
              `Inventory changed while cancelling order ${order.orderNumber}. Please try again.`,
            );
          }

          await tx.inventoryTransaction.create({
            data: {
              inventoryId:
                inventory.id,

              transactionType:
                InventoryTransactionType.RETURN,

              quantity:
                orderItem.quantity,

              balanceAfterTransaction:
                inventory.stockQuantity +
                orderItem.quantity,

              referenceType:
                InventoryReferenceType.ORDER,

              referenceId:
                order.id,

              source:
                'ORDER_CANCELLATION',

              notes:
                `Stock restored after order cancellation`,

              createdBy:
                userId,
            },
          });
        }

        await tx.order.update({
          where: {
            id: order.id,
          },

          data: {
            status:
              OrderStatus.CANCELLED,

            cancelledAt:
              new Date(),

            updatedBy:
              userId,

            version: {
              increment: 1,
            },

            statusHistory: {
              create: {
                previousStatus:
                  order.status,

                newStatus:
                  OrderStatus.CANCELLED,

                remarks:
                  reason ??
                  'Order cancelled by customer',

                createdBy:
                  userId,
              },
            },
          },
        });

        const updated =
          await tx.order.findUnique({
            where: {
              id: order.id,
            },

            include:
              ORDER_WITH_ITEMS_INCLUDE,
          });

        if (!updated) {
          throw new NotFoundException(
            'Order not found after cancellation',
          );
        }

        return OrdersMapper.toResponse(
          updated,
        );
      },
    );
  }

  private async generateOrderNumber(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const timestamp =
      Date.now()
        .toString(36)
        .toUpperCase();

    const random =
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const orderNumber =
      `ORD-${timestamp}-${random}`;

    const existing =
      await tx.order.findUnique({
        where: {
          orderNumber,
        },

        select: {
          id: true,
        },
      });

    if (existing) {
      return this.generateOrderNumber(tx);
    }

    return orderNumber;
  }
}
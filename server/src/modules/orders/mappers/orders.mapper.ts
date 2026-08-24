import { OrderItem } from '@prisma/client';

import { OrderItemResponseDto } from '../dto/order-item-response.dto';
import { OrderResponseDto } from '../dto/order-response.dto';
import { OrderWithItems } from '../types/orders.types';

export class OrdersMapper {
  static toItemResponse(
    item: OrderItem,
  ): OrderItemResponseDto {
    return {
      id: item.id,
      orderId: item.orderId,
      storeProductId: item.storeProductId,

      quantity: item.quantity,

      productNameSnapshot: item.productNameSnapshot,
      unitSnapshot: item.unitSnapshot,

      mrpSnapshot: Number(item.mrpSnapshot),
      sellingPriceSnapshot: Number(
        item.sellingPriceSnapshot,
      ),
      gstRateSnapshot: Number(item.gstRateSnapshot),

      subtotal: Number(item.subtotal),

      fulfillmentStatus: item.fulfillmentStatus,

      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  static toResponse(
    order: OrderWithItems,
  ): OrderResponseDto {
    return {
      id: order.id,

      userId: order.userId,
      storeId: order.storeId,
      addressId: order.addressId,

      orderNumber: order.orderNumber,

      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentType: order.fulfillmentType,

      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      taxAmount: Number(order.taxAmount),
      deliveryFee: Number(order.deliveryFee),
      totalAmount: Number(order.totalAmount),

      deliveryReceiverName:
        order.deliveryReceiverName,
      deliveryPhone: order.deliveryPhone,
      deliveryEmail: order.deliveryEmail,

      deliveryHouseNo: order.deliveryHouseNo,
      deliveryStreet: order.deliveryStreet,
      deliveryArea: order.deliveryArea,
      deliveryLandmark: order.deliveryLandmark,
      deliveryCity: order.deliveryCity,
      deliveryState: order.deliveryState,
      deliveryCountry: order.deliveryCountry,
      deliveryPincode: order.deliveryPincode,

      deliveryLatitude:
        order.deliveryLatitude !== null
          ? Number(order.deliveryLatitude)
          : null,

      deliveryLongitude:
        order.deliveryLongitude !== null
          ? Number(order.deliveryLongitude)
          : null,

      deliveryInstructions:
        order.deliveryInstructions,

      placedAt: order.placedAt,
      version: order.version,

      confirmedAt: order.confirmedAt,
      packedAt: order.packedAt,
      outForDeliveryAt:
        order.outForDeliveryAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      items: order.items.map(
        OrdersMapper.toItemResponse,
      ),
    };
  }
}
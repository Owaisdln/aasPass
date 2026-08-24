import {
  FulfillmentType,
  OrderStatus,
  PaymentStatus,
} from '@prisma/client';

import { OrderItemResponseDto } from './order-item-response.dto';

export class OrderResponseDto {
  id: string;

  userId: string;
  storeId: string;
  addressId: string;

  orderNumber: string;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentType: FulfillmentType;

  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;

  deliveryReceiverName: string;
  deliveryPhone: string;
  deliveryEmail: string | null;

  deliveryHouseNo: string;
  deliveryStreet: string;
  deliveryArea: string;
  deliveryLandmark: string | null;
  deliveryCity: string;
  deliveryState: string;
  deliveryCountry: string;
  deliveryPincode: string;

  deliveryLatitude: number | null;
  deliveryLongitude: number | null;

  deliveryInstructions: string | null;

  placedAt: Date;
  version: number;

  confirmedAt: Date | null;
  packedAt: Date | null;
  outForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  items: OrderItemResponseDto[];
}
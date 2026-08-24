import { FulfillmentStatus } from '@prisma/client';

export class OrderItemResponseDto {
  id: string;
  orderId: string;
  storeProductId: string;

  quantity: number;

  productNameSnapshot: string;
  unitSnapshot: string;

  mrpSnapshot: number;
  sellingPriceSnapshot: number;
  gstRateSnapshot: number;

  subtotal: number;

  fulfillmentStatus: FulfillmentStatus;

  createdAt: Date;
  updatedAt: Date;
}
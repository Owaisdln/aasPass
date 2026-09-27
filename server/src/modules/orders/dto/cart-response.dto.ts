export class CartItemResponseDto {
  id: string;
  storeProductId: string;
  quantity: number;
  productNameSnapshot: string;
  unitSnapshot: string;
  mrpSnapshot: number;
  sellingPriceSnapshot: number;
  gstRateSnapshot: number;
  subtotal: number;
}

export class CartResponseDto {
  id: string;
  userId: string;
  storeId: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  items: CartItemResponseDto[];
}

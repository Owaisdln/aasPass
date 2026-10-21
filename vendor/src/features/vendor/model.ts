// Types mirror the aasPass NestJS DTOs (server/src/modules/**/dto). Do not add
// fields the backend does not return.

export type WeekDay =
  "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export const WEEK_DAYS: WeekDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export type StoreStatus = "PENDING" | "ACTIVE" | "TEMPORARILY_CLOSED" | "SUSPENDED" | "CLOSED";
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type AvailabilityStatus = "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN" | "DISCONTINUED";
export type InventoryTransactionType =
  "PURCHASE" | "SALE" | "RETURN" | "RESTOCK" | "ADJUSTMENT" | "DAMAGE" | "EXPIRED";
export type InventoryReferenceType = "ORDER" | "PURCHASE" | "RETURN" | "MANUAL";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED";
export type FulfillmentType = "DELIVERY" | "PICKUP";
export type PaymentStatus =
  "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "CANCELLED" | "PARTIALLY_REFUNDED" | "REFUNDED";
export type PaymentMethod = "COD" | "UPI" | "CARD" | "NET_BANKING" | "WALLET";

export type Store = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  email: string | null;
  gstNumber: string | null;
  businessRegistrationNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  status: StoreStatus;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  isOpen: boolean;
  logoKey: string | null;
  bannerKey: string | null;
  createdAt: string;
  updatedAt: string;
};
export type UpdateStoreInput = Partial<
  Pick<
    Store,
    | "name"
    | "description"
    | "phone"
    | "email"
    | "gstNumber"
    | "businessRegistrationNumber"
    | "addressLine1"
    | "addressLine2"
    | "city"
    | "state"
    | "country"
    | "pincode"
    | "latitude"
    | "longitude"
    | "timezone"
  >
>;
export type CreateStoreInput = UpdateStoreInput &
  Pick<
    Store,
    | "name"
    | "phone"
    | "addressLine1"
    | "city"
    | "state"
    | "country"
    | "pincode"
    | "latitude"
    | "longitude"
  >;

export type StoreHour = {
  id: string;
  weekDay: WeekDay;
  openingTime: string | null;
  closingTime: string | null;
  isClosed: boolean;
};
export type StoreHourInput = {
  weekDay: WeekDay;
  openingTime?: string;
  closingTime?: string;
  isClosed: boolean;
};

export type DeliverySettings = {
  id: string;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  minimumOrderAmount: number;
  deliveryRadiusKm: number;
  deliveryCharge: number;
  freeDeliveryAbove: number | null;
  estimatedDeliveryTime: number;
};
export type UpdateDeliverySettingsInput = Partial<
  Omit<DeliverySettings, "id" | "freeDeliveryAbove">
> & { freeDeliveryAbove?: number };

export type MasterProduct = {
  id: string;
  categoryId: string;
  brandId: string | null;
  unitId: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  hsnCode: string | null;
  gstRate: string;
  unitValue: string;
  isVeg: boolean | null;
  isFeatured: boolean;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
};
export type Category = { id: string; name: string };
export type Unit = { id: string; name: string; symbol?: string; abbreviation?: string };

export type StoreProduct = {
  id: string;
  storeId: string;
  masterProductId: string;
  mrp: string;
  sellingPrice: string;
  availabilityStatus: AvailabilityStatus;
  trackInventory: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};
export type CreateStoreProductInput = {
  masterProductId: string;
  mrp: number;
  sellingPrice: number;
  availabilityStatus?: AvailabilityStatus;
  trackInventory?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
};
export type UpdateStoreProductInput = Partial<Omit<CreateStoreProductInput, "masterProductId">>;

export type Inventory = {
  id: string;
  storeProductId: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  reorderLevel: number;
  version: number;
  lastStockUpdate: string | null;
};
export type CreateInventoryInput = {
  storeProductId: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  reorderLevel?: number;
};
export type AdjustInventoryInput = {
  transactionType: InventoryTransactionType;
  quantity: number;
  referenceType?: InventoryReferenceType | undefined;
  notes?: string | undefined;
  expectedVersion: number;
};
export type InventoryTransaction = {
  id: string;
  inventoryId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  balanceAfterTransaction: number;
  referenceType: InventoryReferenceType | null;
  notes: string | null;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  storeProductId: string;
  quantity: number;
  productNameSnapshot: string;
  unitSnapshot: string;
  mrpSnapshot: number;
  sellingPriceSnapshot: number;
  subtotal: number;
};
export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  fulfillmentType: FulfillmentType;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryReceiverName: string;
  deliveryPhone: string;
  deliveryHouseNo: string;
  deliveryStreet: string;
  deliveryArea: string;
  deliveryLandmark: string | null;
  deliveryCity: string;
  deliveryPincode: string;
  deliveryInstructions: string | null;
  placedAt: string;
  items: OrderItem[];
};

export type VendorSession = { mode: "demo" | "live"; email: string; name: string };

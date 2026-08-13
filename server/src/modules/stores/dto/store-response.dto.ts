import {
  StoreStatus,
  VerificationStatus,
} from '@prisma/client';

export class StoreResponseDto {
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

  verifiedAt: Date | null;

  isOpen: boolean;

  logoKey: string | null;
  bannerKey: string | null;

  createdAt: Date;
  updatedAt: Date;
}
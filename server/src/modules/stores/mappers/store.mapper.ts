import { Injectable } from '@nestjs/common';

import { StoreResponseDto } from '../dto/store-response.dto';
import { StoreWithRelations } from '../types/store.types';

@Injectable()
export class StoreMapper {
  toResponse(
    store: StoreWithRelations,
  ): StoreResponseDto {
    return {
      id: store.id,

      name: store.name,
      slug: store.slug,
      description: store.description,

      phone: store.phone,
      email: store.email,

      gstNumber: store.gstNumber,
      businessRegistrationNumber:
        store.businessRegistrationNumber,

      addressLine1: store.addressLine1,
      addressLine2: store.addressLine2,
      city: store.city,
      state: store.state,
      country: store.country,
      pincode: store.pincode,

      latitude: Number(store.latitude),
      longitude: Number(store.longitude),
      timezone: store.timezone,

      status: store.status,
      verificationStatus:
        store.verificationStatus,

      verifiedAt: store.verifiedAt,

      isOpen: store.isOpen,

      logoKey: store.logoKey,
      bannerKey: store.bannerKey,

      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }
}
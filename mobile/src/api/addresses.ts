// ---------------------------------------------------------------------------
// Addresses API — mirrors the backend users/me/addresses endpoints.
// ---------------------------------------------------------------------------

import { apiFetch } from "./client";

export type AddressResponse = {
  id: string;
  userId: string;
  label: string | null;
  receiverName: string;
  receiverPhone: string;
  houseNo: string;
  street: string | null;
  area: string;
  landmark: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
};

export type CreateAddressBody = Omit<AddressResponse, "id" | "userId">;

export const listAddresses = () =>
  apiFetch<AddressResponse[]>("/users/me/addresses");

export const createAddress = (body: Partial<CreateAddressBody>) =>
  apiFetch<AddressResponse>("/users/me/addresses", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const deleteAddress = (addressId: string) =>
  apiFetch<void>(`/users/me/addresses/${addressId}`, { method: "DELETE" });

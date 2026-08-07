export class UserResponseDto {
  id: string;

  firstName: string;

  lastName: string | null;

  email: string | null;

  phone: string | null;

  role: string;

  status: string;

  emailVerifiedAt: Date | null;

  phoneVerifiedAt: Date | null;

  lastSeenAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}
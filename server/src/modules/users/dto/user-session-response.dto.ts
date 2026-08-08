import { DeviceType } from '@prisma/client';

export class UserSessionResponseDto {
  id: string;

  deviceType: DeviceType;

  browser: string | null;

  os: string | null;

  lastActivityAt: Date;

  createdAt: Date;

  revokedAt: Date | null;
}
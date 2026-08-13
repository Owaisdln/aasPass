import { WeekDay } from '@prisma/client';

export class StoreHourResponseDto {
  id: string;

  weekDay: WeekDay;

  openingTime: Date | null;
  closingTime: Date | null;

  isClosed: boolean;

  createdAt: Date;
  updatedAt: Date;
}
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

import {
  StoreHourInputDto,
  UpdateStoreHoursDto,
} from '../../dto/hours/update-store-hours.dto';
import { StoreHourResponseDto } from '../../dto/hours/store-hour-response.dto';

@Injectable()
export class StoreHoursService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getMyHours(
    userId: string,
  ): Promise<StoreHourResponseDto[]> {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException(
        'Store not found.',
      );
    }

    const hours =
      await this.prisma.storeHour.findMany({
        where: { storeId: store.id },
        orderBy: { weekDay: 'asc' },
      });

    return hours.map((hour) => ({
      id: hour.id,
      weekDay: hour.weekDay,
      openingTime: hour.openingTime,
      closingTime: hour.closingTime,
      isClosed: hour.isClosed,
      createdAt: hour.createdAt,
      updatedAt: hour.updatedAt,
    }));
  }

  async updateMyHours(
    userId: string,
    dto: UpdateStoreHoursDto,
  ): Promise<StoreHourResponseDto[]> {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException(
        'Store not found.',
      );
    }

    this.validateHours(dto.hours);

    await this.prisma.$transaction(async (tx) => {
      for (const hour of dto.hours) {
        await tx.storeHour.upsert({
          where: {
            storeId_weekDay: {
              storeId: store.id,
              weekDay: hour.weekDay,
            },
          },
          create: {
            storeId: store.id,
            weekDay: hour.weekDay,
            openingTime: hour.isClosed
              ? null
              : this.timeToDate(hour.openingTime!),
            closingTime: hour.isClosed
              ? null
              : this.timeToDate(hour.closingTime!),
            isClosed: hour.isClosed,
            createdBy: userId,
            updatedBy: userId,
          },
          update: {
            openingTime: hour.isClosed
              ? null
              : this.timeToDate(hour.openingTime!),
            closingTime: hour.isClosed
              ? null
              : this.timeToDate(hour.closingTime!),
            isClosed: hour.isClosed,
            updatedBy: userId,
          },
        });
      }
    });

    return this.getMyHours(userId);
  }

  private validateHours(
    hours: StoreHourInputDto[],
  ): void {
    const weekDays = new Set<string>();

    for (const hour of hours) {
      if (weekDays.has(hour.weekDay)) {
        throw new BadRequestException(
          `Duplicate hours provided for ${hour.weekDay}.`,
        );
      }

      weekDays.add(hour.weekDay);

      if (hour.isClosed) {
        continue;
      }

      if (
        !hour.openingTime ||
        !hour.closingTime
      ) {
        throw new BadRequestException(
          `Opening and closing times are required when ${hour.weekDay} is not closed.`,
        );
      }
    }
  }

  private timeToDate(time: string): Date {
    const [hours, minutes] =
      time.split(':').map(Number);

    const date = new Date(1970, 0, 1);

    date.setHours(
      hours,
      minutes,
      0,
      0,
    );

    return date;
  }
}
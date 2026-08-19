import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Unit } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

import { CreateUnitDto } from '../dto/create-unit.dto';
import { UpdateUnitDto } from '../dto/update-unit.dto';
import { UnitResponseDto } from '../dto/unit-response.dto';
import { UnitMapper } from '../mappers/unit.mapper';

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateUnitDto,
  ): Promise<UnitResponseDto> {
    const name = dto.name.trim();
    const symbol = dto.symbol.trim();

    const existingUnit = await this.prisma.unit.findFirst({
      where: {
        OR: [
          {
            name: {
              equals: name,
              mode: 'insensitive',
            },
          },
          {
            symbol: {
              equals: symbol,
              mode: 'insensitive',
            },
          },
        ],
        deletedAt: null,
      },
    });

    if (existingUnit) {
      throw new ConflictException(
        'A unit with this name or symbol already exists',
      );
    }

    try {
      const unit = await this.prisma.unit.create({
        data: {
          name,
          symbol,
          description: dto.description?.trim() || null,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      return UnitMapper.toResponse(unit);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(): Promise<UnitResponseDto[]> {
    const units = await this.prisma.unit.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return units.map((unit) =>
      UnitMapper.toResponse(unit),
    );
  }

  async findById(id: string): Promise<UnitResponseDto> {
    const unit = await this.findActiveUnit(id);

    return UnitMapper.toResponse(unit);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateUnitDto,
  ): Promise<UnitResponseDto> {
    const existingUnit = await this.findActiveUnit(id);

    const data: Prisma.UnitUpdateInput = {
      updatedBy: userId,
    };

    const name =
      dto.name !== undefined
        ? dto.name.trim()
        : undefined;

    const symbol =
      dto.symbol !== undefined
        ? dto.symbol.trim()
        : undefined;

    if (name !== undefined && !name) {
      throw new ConflictException(
        'Unit name cannot be empty',
      );
    }

    if (symbol !== undefined && !symbol) {
      throw new ConflictException(
        'Unit symbol cannot be empty',
      );
    }

    if (
      (name !== undefined &&
        name.toLowerCase() !==
          existingUnit.name.toLowerCase()) ||
      (symbol !== undefined &&
        symbol.toLowerCase() !==
          existingUnit.symbol.toLowerCase())
    ) {
      const duplicate = await this.prisma.unit.findFirst({
        where: {
          OR: [
            ...(name !== undefined
              ? [
                  {
                    name: {
                      equals: name,
                      mode: 'insensitive' as const,
                    },
                  },
                ]
              : []),
            ...(symbol !== undefined
              ? [
                  {
                    symbol: {
                      equals: symbol,
                      mode: 'insensitive' as const,
                    },
                  },
                ]
              : []),
          ],
          deletedAt: null,
          id: {
            not: id,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'A unit with this name or symbol already exists',
        );
      }
    }

    if (name !== undefined) {
      data.name = name;
    }

    if (symbol !== undefined) {
      data.symbol = symbol;
    }

    if (dto.description !== undefined) {
      data.description =
        dto.description?.trim() || null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      const unit = await this.prisma.unit.update({
        where: {
          id,
        },
        data,
      });

      return UnitMapper.toResponse(unit);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<void> {
    const unit = await this.findActiveUnit(id);

    const productCount =
      await this.prisma.masterProduct.count({
        where: {
          unitId: unit.id,
          deletedAt: null,
        },
      });

    if (productCount > 0) {
      throw new ConflictException(
        'Unit cannot be deleted because it is associated with products',
      );
    }

    try {
      await this.prisma.unit.update({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
          isActive: false,
          updatedBy: userId,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private async findActiveUnit(
    id: string,
  ): Promise<Unit> {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!unit) {
      throw new NotFoundException(
        'Unit not found',
      );
    }

    return unit;
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A unit with the provided unique value already exists',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Unit not found',
        );
      }
    }

    throw error;
  }
}
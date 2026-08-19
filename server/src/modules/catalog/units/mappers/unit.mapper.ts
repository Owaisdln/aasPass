import { Unit } from '@prisma/client';

import { UnitResponseDto } from '../dto/unit-response.dto';

export class UnitMapper {
  static toResponse(unit: Unit): UnitResponseDto {
    return {
      id: unit.id,
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description,
      isActive: unit.isActive,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }
}
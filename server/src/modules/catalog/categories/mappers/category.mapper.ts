import { Injectable } from '@nestjs/common';

import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryWithParent } from '../types/category.types';

@Injectable()
export class CategoryMapper {
  toResponseDto(category: CategoryWithParent): CategoryResponseDto {
    return {
      id: category.id,
      parentCategoryId: category.parentCategoryId,

      name: category.name,
      slug: category.slug,
      description: category.description,

      imageKey: category.imageKey,
      iconKey: category.iconKey,

      sortOrder: category.sortOrder,
      isActive: category.isActive,

      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  toResponseDtoWithoutRelation(
    category: {
      id: string;
      parentCategoryId: string | null;
      name: string;
      slug: string;
      description: string | null;
      imageKey: string | null;
      iconKey: string | null;
      sortOrder: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): CategoryResponseDto {
    return {
      id: category.id,
      parentCategoryId: category.parentCategoryId,

      name: category.name,
      slug: category.slug,
      description: category.description,

      imageKey: category.imageKey,
      iconKey: category.iconKey,

      sortOrder: category.sortOrder,
      isActive: category.isActive,

      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
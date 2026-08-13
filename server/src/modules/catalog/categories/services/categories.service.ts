import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Category } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryMapper } from '../mappers/category.mapper';
import {
  CATEGORY_WITH_PARENT_INCLUDE,
  CategoryWithParent,
} from '../types/category.types';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryMapper: CategoryMapper,
  ) {}

  async create(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const name = dto.name.trim();

    if (!name) {
      throw new ConflictException('Category name cannot be empty.');
    }

    const slug = await this.generateUniqueSlug(name);

    if (dto.parentCategoryId) {
      await this.assertParentCategoryExists(dto.parentCategoryId);
    }

    try {
      const category = await this.prisma.category.create({
        data: {
          name,
          slug,
          parentCategoryId: dto.parentCategoryId ?? null,
          description: dto.description?.trim() || null,
          imageKey: dto.imageKey ?? null,
          iconKey: dto.iconKey ?? null,
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
          createdBy: userId,
          updatedBy: userId,
        },
        include: CATEGORY_WITH_PARENT_INCLUDE,
      });

      return this.categoryMapper.toResponseDto(category);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
      },
      include: CATEGORY_WITH_PARENT_INCLUDE,
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return categories.map((category) =>
      this.categoryMapper.toResponseDto(category),
    );
  }

  async findById(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: CATEGORY_WITH_PARENT_INCLUDE,
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return this.categoryMapper.toResponseDto(category);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const existingCategory = await this.findCategoryRecord(id);

    if (dto.parentCategoryId !== undefined) {
      await this.validateParentChange(
        existingCategory.id,
        dto.parentCategoryId,
      );
    }

    const updateData: Prisma.CategoryUpdateInput = {
      updatedBy: userId,
    };

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new ConflictException('Category name cannot be empty.');
      }

      updateData.name = name;

      if (name.toLowerCase() !== existingCategory.name.toLowerCase()) {
        updateData.slug = await this.generateUniqueSlug(name, id);
      }
    }

    if (dto.parentCategoryId !== undefined) {
      updateData.parentCategory = dto.parentCategoryId
        ? {
            connect: {
              id: dto.parentCategoryId,
            },
          }
        : {
            disconnect: true,
          };
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description.trim() || null;
    }

    if (dto.imageKey !== undefined) {
      updateData.imageKey = dto.imageKey;
    }

    if (dto.iconKey !== undefined) {
      updateData.iconKey = dto.iconKey;
    }

    if (dto.sortOrder !== undefined) {
      updateData.sortOrder = dto.sortOrder;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    try {
      const category = await this.prisma.category.update({
        where: {
          id,
        },
        data: updateData,
        include: CATEGORY_WITH_PARENT_INCLUDE,
      });

      return this.categoryMapper.toResponseDto(category);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.findCategoryRecord(id);

    const childCount = await this.prisma.category.count({
      where: {
        parentCategoryId: category.id,
        deletedAt: null,
      },
    });

    if (childCount > 0) {
      throw new ConflictException(
        'Cannot delete a category that has active subcategories.',
      );
    }

    const productCount = await this.prisma.masterProduct.count({
      where: {
        categoryId: category.id,
        deletedAt: null,
      },
    });

    if (productCount > 0) {
      throw new ConflictException(
        'Cannot delete a category that has active products.',
      );
    }

    try {
      await this.prisma.category.update({
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

  private async findCategoryRecord(id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return category;
  }

  private async assertParentCategoryExists(
    parentCategoryId: string,
  ): Promise<void> {
    const parent = await this.prisma.category.findFirst({
      where: {
        id: parentCategoryId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent category not found.');
    }
  }

  private async validateParentChange(
    categoryId: string,
    parentCategoryId: string | undefined,
  ): Promise<void> {
    if (!parentCategoryId) {
      return;
    }

    if (parentCategoryId === categoryId) {
      throw new ConflictException(
        'A category cannot be its own parent.',
      );
    }

    await this.assertParentCategoryExists(parentCategoryId);

    let currentParentId: string | null = parentCategoryId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        throw new ConflictException(
          'Invalid category hierarchy: circular parent relationship detected.',
        );
      }

      const parent = await this.prisma.category.findFirst({
        where: {
          id: currentParentId,
          deletedAt: null,
        },
        select: {
          parentCategoryId: true,
        },
      });

      currentParentId = parent?.parentCategoryId ?? null;
    }
  }

  private async generateUniqueSlug(
    name: string,
    excludeCategoryId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(name);

    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await this.prisma.category.findFirst({
        where: {
          slug,
          ...(excludeCategoryId
            ? {
                NOT: {
                  id: excludeCategoryId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private slugify(value: string): string {
    const slug = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      throw new ConflictException(
        'Category name cannot produce a valid slug.',
      );
    }

    return slug;
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A category with the same slug already exists.',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Category not found.');
    }

    throw error;
  }
}
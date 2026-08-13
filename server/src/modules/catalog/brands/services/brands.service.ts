import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Brand } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { BrandResponseDto } from '../dto/brand-response.dto';
import { BrandMapper } from '../mappers/brand.mapper';

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateBrandDto,
  ): Promise<BrandResponseDto> {
    const name = dto.name.trim();

    const existingBrand = await this.prisma.brand.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (existingBrand) {
      throw new ConflictException(
        'A brand with this name already exists',
      );
    }

    const slug = await this.generateUniqueSlug(name);

    try {
      const brand = await this.prisma.brand.create({
        data: {
          name,
          slug,
          logoKey: dto.logoKey?.trim() || null,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      return BrandMapper.toResponse(brand);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(): Promise<BrandResponseDto[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return brands.map((brand) =>
      BrandMapper.toResponse(brand),
    );
  }

  async findById(id: string): Promise<BrandResponseDto> {
    const brand = await this.findActiveBrand(id);

    return BrandMapper.toResponse(brand);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBrandDto,
  ): Promise<BrandResponseDto> {
    const existingBrand = await this.findActiveBrand(id);

    const data: Prisma.BrandUpdateInput = {
      updatedBy: userId,
    };

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new ConflictException(
          'Brand name cannot be empty',
        );
      }

      if (
        name.toLowerCase() !==
        existingBrand.name.toLowerCase()
      ) {
        const duplicate = await this.prisma.brand.findFirst({
          where: {
            name: {
              equals: name,
              mode: 'insensitive',
            },
            deletedAt: null,
            id: {
              not: id,
            },
          },
        });

        if (duplicate) {
          throw new ConflictException(
            'A brand with this name already exists',
          );
        }

        data.name = name;
        data.slug = await this.generateUniqueSlug(
          name,
          id,
        );
      }
    }

    if (dto.logoKey !== undefined) {
      data.logoKey = dto.logoKey?.trim() || null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      const brand = await this.prisma.brand.update({
        where: {
          id,
        },
        data,
      });

      return BrandMapper.toResponse(brand);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<void> {
    const brand = await this.findActiveBrand(id);

    const productCount =
      await this.prisma.masterProduct.count({
        where: {
          brandId: brand.id,
          deletedAt: null,
        },
      });

    if (productCount > 0) {
      throw new ConflictException(
        'Brand cannot be deleted because it is associated with products',
      );
    }

    try {
      await this.prisma.brand.update({
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

  private async findActiveBrand(
    id: string,
  ): Promise<Brand> {
    const brand = await this.prisma.brand.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!brand) {
      throw new NotFoundException(
        'Brand not found',
      );
    }

    return brand;
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingBrand =
        await this.prisma.brand.findFirst({
          where: {
            slug,
            ...(excludeId
              ? {
                  id: {
                    not: excludeId,
                  },
                }
              : {}),
          },
        });

      if (!existingBrand) {
        return slug;
      }

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  private slugify(value: string): string {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'brand';
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A brand with the provided unique value already exists',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Brand not found',
        );
      }
    }

    throw error;
  }
}
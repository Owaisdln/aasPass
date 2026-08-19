import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProductStatus,
  MasterProduct,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

import { CreateMasterProductDto } from '../dto/create-master-product.dto';
import { UpdateMasterProductDto } from '../dto/update-master-product.dto';
import { MasterProductResponseDto } from '../dto/master-product-response.dto';
import { MasterProductMapper } from '../mappers/master-product.mapper';

@Injectable()
export class MasterProductsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateMasterProductDto,
  ): Promise<MasterProductResponseDto> {
    const name = dto.name.trim();
    const sku = dto.sku.trim();
    const barcode = dto.barcode?.trim() || null;
    const hsnCode = dto.hsnCode?.trim() || null;

    await this.validateReferences(
      dto.categoryId,
      dto.brandId,
      dto.unitId,
    );

    await this.ensureSkuAvailable(sku);

    if (barcode) {
      await this.ensureBarcodeAvailable(barcode);
    }

    const slug = await this.generateUniqueSlug(name);

    try {
      const product =
        await this.prisma.masterProduct.create({
          data: {
            categoryId: dto.categoryId,
            brandId: dto.brandId ?? null,
            unitId: dto.unitId,

            name,
            slug,
            description:
              dto.description?.trim() || null,

            sku,
            barcode,
            hsnCode,

            gstRate: dto.gstRate,
            unitValue: dto.unitValue,

            isVeg: dto.isVeg ?? null,
            isFeatured: dto.isFeatured ?? false,

            status: ProductStatus.ACTIVE,

            createdBy: userId,
            updatedBy: userId,
          },
        });

      return MasterProductMapper.toResponse(
        product,
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(): Promise<MasterProductResponseDto[]> {
    const products =
      await this.prisma.masterProduct.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          name: 'asc',
        },
      });

    return products.map((product) =>
      MasterProductMapper.toResponse(product),
    );
  }

  async findById(
    id: string,
  ): Promise<MasterProductResponseDto> {
    const product =
      await this.findActiveProduct(id);

    return MasterProductMapper.toResponse(
      product,
    );
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateMasterProductDto,
  ): Promise<MasterProductResponseDto> {
    const existingProduct =
      await this.findActiveProduct(id);

    if (
      dto.categoryId !== undefined ||
      dto.brandId !== undefined ||
      dto.unitId !== undefined
    ) {
      await this.validateReferences(
        dto.categoryId ?? existingProduct.categoryId,
        dto.brandId !== undefined
          ? dto.brandId
          : existingProduct.brandId,
        dto.unitId ?? existingProduct.unitId,
      );
    }

    const data: Prisma.MasterProductUpdateInput = {
      updatedBy: userId,
    };

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new ConflictException(
          'Product name cannot be empty',
        );
      }

      if (
        name.toLowerCase() !==
        existingProduct.name.toLowerCase()
      ) {
        data.name = name;
        data.slug =
          await this.generateUniqueSlug(
            name,
            id,
          );
      }
    }

    if (dto.categoryId !== undefined) {
      data.category = {
        connect: {
          id: dto.categoryId,
        },
      };
    }

    if (dto.brandId !== undefined) {
      data.brand =
        dto.brandId === null
          ? { disconnect: true }
          : {
              connect: {
                id: dto.brandId,
              },
            };
    }

    if (dto.unitId !== undefined) {
      data.unit = {
        connect: {
          id: dto.unitId,
        },
      };
    }

    if (dto.description !== undefined) {
      data.description =
        dto.description?.trim() || null;
    }

    if (dto.sku !== undefined) {
      const sku = dto.sku.trim();

      if (!sku) {
        throw new ConflictException(
          'SKU cannot be empty',
        );
      }

      if (
        sku.toLowerCase() !==
        existingProduct.sku.toLowerCase()
      ) {
        await this.ensureSkuAvailable(
          sku,
          id,
        );
      }

      data.sku = sku;
    }

    if (dto.barcode !== undefined) {
      const barcode =
        dto.barcode?.trim() || null;

      if (
        barcode !== null &&
        barcode.toLowerCase() !==
          existingProduct.barcode?.toLowerCase()
      ) {
        await this.ensureBarcodeAvailable(
          barcode,
          id,
        );
      }

      data.barcode = barcode;
    }

    if (dto.hsnCode !== undefined) {
      data.hsnCode =
        dto.hsnCode?.trim() || null;
    }

    if (dto.gstRate !== undefined) {
      data.gstRate = dto.gstRate;
    }

    if (dto.unitValue !== undefined) {
      data.unitValue = dto.unitValue;
    }

    if (dto.isVeg !== undefined) {
      data.isVeg = dto.isVeg;
    }

    if (dto.isFeatured !== undefined) {
      data.isFeatured = dto.isFeatured;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    try {
      const product =
        await this.prisma.masterProduct.update({
          where: {
            id,
          },
          data,
        });

      return MasterProductMapper.toResponse(
        product,
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<void> {
    const product =
      await this.findActiveProduct(id);

    const storeProductCount =
      await this.prisma.storeProduct.count({
        where: {
          masterProductId: product.id,
          deletedAt: null,
        },
      });

    if (storeProductCount > 0) {
      throw new ConflictException(
        'Product cannot be deleted because it is associated with store listings',
      );
    }

    try {
      await this.prisma.masterProduct.update({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
          status: ProductStatus.DISCONTINUED,
          updatedBy: userId,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private async findActiveProduct(
    id: string,
  ): Promise<MasterProduct> {
    const product =
      await this.prisma.masterProduct.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Master product not found',
      );
    }

    return product;
  }

  private async validateReferences(
    categoryId: string,
    brandId: string | null | undefined,
    unitId: string,
  ): Promise<void> {
    const category =
      await this.prisma.category.findFirst({
        where: {
          id: categoryId,
          deletedAt: null,
          isActive: true,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Active category not found',
      );
    }

    const unit =
      await this.prisma.unit.findFirst({
        where: {
          id: unitId,
          deletedAt: null,
          isActive: true,
        },
      });

    if (!unit) {
      throw new NotFoundException(
        'Active unit not found',
      );
    }

    if (brandId) {
      const brand =
        await this.prisma.brand.findFirst({
          where: {
            id: brandId,
            deletedAt: null,
            isActive: true,
          },
        });

      if (!brand) {
        throw new NotFoundException(
          'Active brand not found',
        );
      }
    }
  }

  private async ensureSkuAvailable(
    sku: string,
    excludeId?: string,
  ): Promise<void> {
    const existing =
      await this.prisma.masterProduct.findFirst({
        where: {
          sku: {
            equals: sku,
            mode: 'insensitive',
          },
          ...(excludeId
            ? {
                id: {
                  not: excludeId,
                },
              }
            : {}),
        },
      });

    if (existing) {
      throw new ConflictException(
        'A product with this SKU already exists',
      );
    }
  }

  private async ensureBarcodeAvailable(
    barcode: string,
    excludeId?: string,
  ): Promise<void> {
    const existing =
      await this.prisma.masterProduct.findFirst({
        where: {
          barcode: {
            equals: barcode,
            mode: 'insensitive',
          },
          ...(excludeId
            ? {
                id: {
                  not: excludeId,
                },
              }
            : {}),
        },
      });

    if (existing) {
      throw new ConflictException(
        'A product with this barcode already exists',
      );
    }
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug =
      this.slugify(name);

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing =
        await this.prisma.masterProduct.findFirst({
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

      if (!existing) {
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

    return slug || 'product';
  }

  private handlePrismaError(
    error: unknown,
  ): never {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A product with the provided unique value already exists',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Master product not found',
        );
      }
    }

    throw error;
  }
}
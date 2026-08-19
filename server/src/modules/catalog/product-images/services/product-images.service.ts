import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  ProductImageType,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

import { CreateProductImageDto } from '../dto/create-product-image.dto';
import { UpdateProductImageDto } from '../dto/update-product-image.dto';
import { ProductImageResponseDto } from '../dto/product-image-response.dto';
import { ProductImageMapper } from '../mappers/product-image.mapper';

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    const objectKey = dto.objectKey.trim();

    if (!objectKey) {
      throw new ConflictException(
        'Object key cannot be empty',
      );
    }

    await this.ensureMasterProductExists(
      dto.masterProductId,
    );

    const isPrimary =
      dto.imageType === ProductImageType.PRIMARY;

    try {
      const image =
        await this.prisma.$transaction(
          async (tx) => {
            if (isPrimary) {
              await tx.productImage.updateMany({
                where: {
                  masterProductId:
                    dto.masterProductId,
                  isPrimary: true,
                },
                data: {
                  isPrimary: false,
                  imageType:
                    ProductImageType.GALLERY,
                  updatedBy: userId,
                },
              });
            }

            return tx.productImage.create({
              data: {
                masterProductId:
                  dto.masterProductId,
                objectKey,
                imageType: dto.imageType,
                isPrimary,
                displayOrder: dto.displayOrder,
                createdBy: userId,
                updatedBy: userId,
              },
            });
          },
        );

      return ProductImageMapper.toResponse(
        image,
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findByProduct(
    masterProductId: string,
  ): Promise<ProductImageResponseDto[]> {
    await this.ensureMasterProductExists(
      masterProductId,
    );

    const images =
      await this.prisma.productImage.findMany({
        where: {
          masterProductId,
        },
        orderBy: [
          {
            isPrimary: 'desc',
          },
          {
            displayOrder: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
      });

    return images.map((image) =>
      ProductImageMapper.toResponse(image),
    );
  }

  async findById(
    id: string,
  ): Promise<ProductImageResponseDto> {
    const image =
      await this.findImage(id);

    return ProductImageMapper.toResponse(image);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    const existingImage =
      await this.findImage(id);

    const imageType =
      dto.imageType ?? existingImage.imageType;

    const isPrimary =
      imageType === ProductImageType.PRIMARY;

    const data: Prisma.ProductImageUpdateInput = {
      updatedBy: userId,
    };

    if (dto.objectKey !== undefined) {
      const objectKey = dto.objectKey.trim();

      if (!objectKey) {
        throw new ConflictException(
          'Object key cannot be empty',
        );
      }

      data.objectKey = objectKey;
    }

    if (dto.displayOrder !== undefined) {
      data.displayOrder = dto.displayOrder;
    }

    data.imageType = imageType;
    data.isPrimary = isPrimary;

    try {
      const image =
        await this.prisma.$transaction(
          async (tx) => {
            if (isPrimary) {
              await tx.productImage.updateMany({
                where: {
                  masterProductId:
                    existingImage.masterProductId,
                  isPrimary: true,
                  id: {
                    not: id,
                  },
                },
                data: {
                  isPrimary: false,
                  imageType:
                    ProductImageType.GALLERY,
                  updatedBy: userId,
                },
              });
            }

            return tx.productImage.update({
              where: {
                id,
              },
              data,
            });
          },
        );

      return ProductImageMapper.toResponse(
        image,
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(
    id: string,
  ): Promise<void> {
    const image =
      await this.findImage(id);

    try {
      await this.prisma.productImage.delete({
        where: {
          id: image.id,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private async findImage(
    id: string,
  ) {
    const image =
      await this.prisma.productImage.findUnique({
        where: {
          id,
        },
      });

    if (!image) {
      throw new NotFoundException(
        'Product image not found',
      );
    }

    return image;
  }

  private async ensureMasterProductExists(
    masterProductId: string,
  ): Promise<void> {
    const product =
      await this.prisma.masterProduct.findFirst({
        where: {
          id: masterProductId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Master product not found',
      );
    }
  }

  private handlePrismaError(
    error: unknown,
  ): never {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Product image not found',
        );
      }

      if (error.code === 'P2003') {
        throw new ConflictException(
          'Product image references an invalid product',
        );
      }
    }

    throw error;
  }
}
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

import { CreateStoreImageDto } from '../../dto/images/create-store-image.dto';
import { StoreImageResponseDto } from '../../dto/images/store-image-response.dto';
import { UpdateStoreImageOrderDto } from '../../dto/images/update-store-image-order.dto';

@Injectable()
export class StoreImagesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getMyImages(
    userId: string,
  ): Promise<StoreImageResponseDto[]> {
    const store = await this.resolveOwnStore(userId);

    const images =
      await this.prisma.storeImage.findMany({
        where: {
          storeId: store.id,
        },
        orderBy: [
          {
            displayOrder: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
      });

    return images.map((image) =>
      this.toResponse(image),
    );
  }

  async addImage(
    userId: string,
    dto: CreateStoreImageDto,
  ): Promise<StoreImageResponseDto> {
    const store = await this.resolveOwnStore(userId);

    const displayOrder =
      dto.displayOrder ??
      (await this.getNextDisplayOrder(store.id));

    const image =
      await this.prisma.storeImage.create({
        data: {
          storeId: store.id,
          objectKey: dto.objectKey,
          displayOrder,
          createdBy: userId,
          updatedBy: userId,
        },
      });

    return this.toResponse(image);
  }

  async updateImageOrder(
    userId: string,
    imageId: string,
    dto: UpdateStoreImageOrderDto,
  ): Promise<StoreImageResponseDto> {
    const store = await this.resolveOwnStore(userId);

    const image =
      await this.prisma.storeImage.findFirst({
        where: {
          id: imageId,
          storeId: store.id,
        },
      });

    if (!image) {
      throw new NotFoundException(
        'Store image not found.',
      );
    }

    const conflictingImage =
      await this.prisma.storeImage.findFirst({
        where: {
          storeId: store.id,
          displayOrder: dto.displayOrder,
          id: {
            not: imageId,
          },
        },
      });

    if (conflictingImage) {
      throw new BadRequestException(
        'Another store image already uses this display order.',
      );
    }

    const updatedImage =
      await this.prisma.storeImage.update({
        where: {
          id: image.id,
        },
        data: {
          displayOrder: dto.displayOrder,
          updatedBy: userId,
        },
      });

    return this.toResponse(updatedImage);
  }

  async deleteImage(
    userId: string,
    imageId: string,
  ): Promise<void> {
    const store = await this.resolveOwnStore(userId);

    const image =
      await this.prisma.storeImage.findFirst({
        where: {
          id: imageId,
          storeId: store.id,
        },
        select: {
          id: true,
        },
      });

    if (!image) {
      throw new NotFoundException(
        'Store image not found.',
      );
    }

    await this.prisma.storeImage.delete({
      where: {
        id: image.id,
      },
    });
  }

  private async resolveOwnStore(
    userId: string,
  ): Promise<{ id: string }> {
    const store = await this.prisma.store.findUnique({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!store) {
      throw new NotFoundException(
        'Store not found.',
      );
    }

    return store;
  }

  private async getNextDisplayOrder(
    storeId: string,
  ): Promise<number> {
    const lastImage =
      await this.prisma.storeImage.findFirst({
        where: {
          storeId,
        },
        orderBy: {
          displayOrder: 'desc',
        },
        select: {
          displayOrder: true,
        },
      });

    return (lastImage?.displayOrder ?? 0) + 1;
  }

  private toResponse(
    image: {
      id: string;
      objectKey: string;
      displayOrder: number;
      createdAt: Date;
      updatedAt: Date;
    },
  ): StoreImageResponseDto {
    return {
      id: image.id,
      objectKey: image.objectKey,
      displayOrder: image.displayOrder,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }
}
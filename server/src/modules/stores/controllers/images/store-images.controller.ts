import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../../auth/guards/supabase-auth.guard';

import { CurrentUser } from '../../../../common/identity/current-user.model';

import { CreateStoreImageDto } from '../../dto/images/create-store-image.dto';
import { StoreImageResponseDto } from '../../dto/images/store-image-response.dto';
import { UpdateStoreImageOrderDto } from '../../dto/images/update-store-image-order.dto';

import { StoreImagesService } from '../../services/images/store-images.service';

@Controller('stores/me/images')
@UseGuards(SupabaseAuthGuard)
export class StoreImagesController {
  constructor(
    private readonly storeImagesService: StoreImagesService,
  ) {}

  @Get()
  async getMyImages(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<StoreImageResponseDto[]> {
    return this.storeImagesService.getMyImages(
      currentUser.id,
    );
  }

  @Post()
  async addImage(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Body()
    dto: CreateStoreImageDto,
  ): Promise<StoreImageResponseDto> {
    return this.storeImagesService.addImage(
      currentUser.id,
      dto,
    );
  }

  @Patch(':imageId/order')
  async updateImageOrder(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('imageId')
    imageId: string,
    @Body()
    dto: UpdateStoreImageOrderDto,
  ): Promise<StoreImageResponseDto> {
    return this.storeImagesService.updateImageOrder(
      currentUser.id,
      imageId,
      dto,
    );
  }

  @Delete(':imageId')
  async deleteImage(
    @AuthenticatedUser()
    currentUser: CurrentUser,
    @Param('imageId')
    imageId: string,
  ): Promise<void> {
    return this.storeImagesService.deleteImage(
      currentUser.id,
      imageId,
    );
  }
}
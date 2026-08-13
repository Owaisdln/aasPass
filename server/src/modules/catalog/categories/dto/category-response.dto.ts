export class CategoryResponseDto {
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
}
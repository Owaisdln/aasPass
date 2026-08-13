export class BrandResponseDto {
  id: string;
  name: string;
  slug: string;
  logoKey: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
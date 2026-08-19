export class UnitResponseDto {
  id: string;
  name: string;
  symbol: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
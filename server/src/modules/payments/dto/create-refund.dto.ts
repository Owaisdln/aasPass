import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateRefundDto {
  @IsUUID()
  paymentId: string;

  @IsNumber()
  @Min(0.01)
  @Max(99999999.99)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
import {
  IsString,
  Length,
} from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  @Length(1, 255)
  gatewayOrderId: string;

  @IsString()
  @Length(1, 255)
  gatewayPaymentId: string;

  @IsString()
  @Length(1, 1000)
  gatewaySignature: string;
}
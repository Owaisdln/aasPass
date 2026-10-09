import { IsEmail } from 'class-validator';

export class DemoLoginDto {
  @IsEmail()
  email: string;
}

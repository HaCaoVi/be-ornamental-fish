import { PickType } from '@nestjs/mapped-types';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ActiveAccountDto {
  @IsEmail({}, { message: 'email invalid!' })
  @IsNotEmpty({ message: 'email is required!' })
  email: string;

  @IsNotEmpty({ message: 'code is required!' })
  @IsString({ message: 'code invalid!' })
  code: string;
}

export class RetryActiveAccountDto extends PickType(ActiveAccountDto, [
  'email',
] as const) {}

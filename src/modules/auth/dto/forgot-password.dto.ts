import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'email is required!' })
  @IsEmail({}, { message: 'email invalid!' })
  email: string;

  @IsNotEmpty({ message: 'code is required!' })
  @IsString({ message: 'code invalid!' })
  code: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @Length(8, 32, {
    message: 'password length must be between 8 and 32 characters',
  })
  password: string;
}

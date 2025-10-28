import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';

export class RegisterUserDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required!' })
  name: string;

  @IsNotEmpty({ message: 'email is required!' })
  @IsEmail({}, { message: 'email invalid!' })
  email: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @Length(8, 32, {
    message: 'password length must be between 8 and 32 characters',
  })
  password: string;

  @IsPhoneNumber('VN', { message: 'Invalid Vietnamese phone number format.' })
  @IsString({ message: 'phone must be a string' })
  @IsNotEmpty({ message: 'phone is required!' })
  phone: string;
}

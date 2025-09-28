import { IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
    @IsNotEmpty({ message: 'username is required!' })
    @IsEmail({}, { message: 'username invalid!' })
    username: string;

    @IsNotEmpty({ message: 'description is required' })
    password: string;
}
import { IsDate, IsEmail, IsEnum, IsMongoId, IsNotEmpty, Length, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '../schemas/user.schema';
import { IsPastDate } from '@common/decorators/validate.decorator';

export class CreateUserDto {
    @IsNotEmpty({ message: 'name is required!' })
    name: string;

    @IsNotEmpty({ message: 'email is required!' })
    @IsEmail({}, { message: 'email invalid!' })
    email: string;

    @IsNotEmpty({ message: 'password is required' })
    @Length(8, 32, { message: 'password length must be between 8 and 32 characters' })
    password: string;

    @IsNotEmpty({ message: 'birthday is required!' })
    @IsDate({ message: 'birthday must be a valid date' })
    @Type(() => Date)
    @IsPastDate({ message: 'birthday must be in the past' })
    birthday: Date;

    @IsNotEmpty({ message: 'gender is required!' })
    @IsEnum(Gender, { message: 'gender must be MALE, FEMALE, or OTHER' })
    gender: Gender;

    @IsNotEmpty({ message: 'address is required!' })
    address: string;

    @IsNotEmpty({ message: 'role is required!' })
    @IsMongoId({ message: 'role must be a valid ObjectId!' })
    role: string;
}
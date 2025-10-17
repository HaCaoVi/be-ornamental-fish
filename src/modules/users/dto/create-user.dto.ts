import { IsBoolean, IsDate, IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { IsPastDate } from '@common/decorators/validate.decorator';
import { EGender } from '@common/types/type';
import { Types } from 'mongoose';

export class CreateUserDto {
    @IsString({ message: 'name must be a string' })
    @IsNotEmpty({ message: 'name is required!' })
    name: string;

    @IsNotEmpty({ message: 'email is required!' })
    @IsEmail({}, { message: 'email invalid!' })
    email: string;

    @IsString({ message: 'password must be a string' })
    @IsNotEmpty({ message: 'password is required' })
    @Length(8, 32, { message: 'password length must be between 8 and 32 characters' })
    password: string;

    @IsNotEmpty({ message: 'birthday is required!' })
    @IsDate({ message: 'birthday must be a valid date' })
    @Type(() => Date)
    @IsPastDate({ message: 'birthday must be in the past' })
    birthday: Date;

    @IsNotEmpty({ message: 'gender is required!' })
    @IsEnum(EGender, { message: 'gender must be MALE, FEMALE, or OTHER' })
    gender: EGender;

    @IsString({ message: 'address must be a string' })
    @IsNotEmpty({ message: 'address is required!' })
    address: string;

    @IsNotEmpty({ message: 'role is required!' })
    @IsMongoId({ message: 'role must be a valid ObjectId!' })
    role: Types.ObjectId;

    @IsOptional()
    @IsBoolean({ message: "isActivated must be a valid boolean" })
    isActivated: boolean
}

export class RegisterUserDto {
    @IsString({ message: 'name must be a string' })
    @IsNotEmpty({ message: 'name is required!' })
    name: string;

    @IsNotEmpty({ message: 'email is required!' })
    @IsEmail({}, { message: 'email invalid!' })
    email: string;

    @IsString({ message: 'password must be a string' })
    @IsNotEmpty({ message: 'password is required' })
    @Length(8, 32, { message: 'password length must be between 8 and 32 characters' })
    password: string;

    @IsNotEmpty({ message: 'birthday is required!' })
    @IsDate({ message: 'birthday must be a valid date' })
    @Type(() => Date)
    @IsPastDate({ message: 'birthday must be in the past' })
    birthday: Date;

    @IsPhoneNumber('VN', { message: 'Invalid Vietnamese phone number format.' })
    @IsString({ message: 'phone must be a string' })
    @IsNotEmpty({ message: 'phone is required!' })
    phone: string;

    @IsNotEmpty({ message: 'gender is required!' })
    @IsEnum(EGender, { message: 'gender must be MALE, FEMALE, or OTHER' })
    gender: EGender;

    @IsString({ message: 'address must be a string' })
    @IsNotEmpty({ message: 'address is required!' })
    address: string;
}
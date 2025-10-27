import {
    IsString,
    IsNotEmpty,
    IsNumber,
    Min,
    IsOptional,
    IsMongoId,
    IsBoolean,
    IsArray,
    IsUrl,
    Validate,
} from 'class-validator';
import { Types } from 'mongoose';
import { IsDiscountValid } from '@common/decorators/validate.decorator';

export class CreateProductDto {
    @IsString({ message: 'name must be a string' })
    @IsNotEmpty({ message: 'name is required' })
    name: string;

    @IsString({ message: 'code must be a string' })
    @IsNotEmpty({ message: 'code is required' })
    code: string;

    @IsString({ message: 'description must be a string' })
    @IsNotEmpty({ message: 'description is required' })
    description: string;

    @IsNumber({}, { message: 'price must be a number' })
    @Min(0, { message: 'price cannot be less than 0' })
    price: number;

    @IsNumber({}, { message: 'discount must be a number' })
    @Min(0, { message: 'discount cannot be less than 0' })
    @Validate(IsDiscountValid)
    discount: number;

    @IsString({ message: 'mainImageUrl must be a string' })
    @IsNotEmpty({ message: 'mainImageUrl is required' })
    mainImageUrl: string;

    @IsOptional()
    @IsString({ message: 'mainVideoUrl must be a string' })
    mainVideoUrl?: string;

    @IsNotEmpty({ message: 'categoryDetail is required!' })
    @IsMongoId({ message: 'categoryDetail must be a valid ObjectId!' })
    categoryDetail: Types.ObjectId;

    @IsOptional()
    @IsBoolean({ message: 'isActivated must be a boolean' })
    isActivated?: boolean;

    @IsString({ message: 'color must be a string' })
    @IsOptional()
    color: string;

    @IsString({ message: 'origin must be a string' })
    @IsNotEmpty({ message: 'origin is required' })
    origin: string;

    @IsString({ message: 'size must be a string' })
    @IsOptional()
    size: string;

    @IsString({ message: 'weight must be a string' })
    @IsOptional()
    weight: string;

    @IsNumber({}, { message: 'quantity must be a number' })
    @Min(0, { message: 'quantity cannot be less than 0' })
    @IsNotEmpty({ message: 'quantity is required' })
    quantity: number;
}
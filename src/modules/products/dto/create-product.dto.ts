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
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateFishDto {
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

    @IsNumber({}, { message: 'Discount must be a number' })
    @Min(0, { message: 'Discount cannot be less than 0' })
    discount: number;

    @IsUrl({}, { message: 'mainImageUrl must be a url' })
    @IsString({ message: 'mainImageUrl must be a string' })
    @IsNotEmpty({ message: 'mainImageUrl is required' })
    mainImageUrl: string;

    @IsOptional()
    @IsUrl({}, { message: 'mainVideoUrl must be a url' })
    @IsString({ message: 'mainVideoUrl must be a string' })
    mainVideoUrl: string;

    @IsNotEmpty({ message: 'categoryDetail is required!' })
    @IsMongoId({ message: 'categoryDetail must be a valid ObjectId!' })
    categoryDetail: Types.ObjectId;

    @IsString({ message: 'color must be a string' })
    @IsNotEmpty({ message: 'color is required' })
    color: string

    @IsString({ message: 'color must be a string' })
    @IsNotEmpty({ message: 'color is required' })
    origin: string

    @IsString({ message: 'size must be a string' })
    @IsNotEmpty({ message: 'size is required' })
    size: string

    @IsOptional()
    @IsBoolean({ message: "isActivated must be a valid boolean" })
    isActivated: boolean

    @IsOptional()
    @IsUrl({}, { each: true, message: 'gallery must be a url' })
    @IsArray()
    @IsString({ each: true })
    gallery: string[]

    @IsNumber({}, { message: 'price must be a number' })
    @Min(0, { message: 'price cannot be less than 0' })
    quantity: number
}

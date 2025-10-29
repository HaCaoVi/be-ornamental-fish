import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsString,
    ValidateNested,
} from 'class-validator';

export class ProductOrder {
    @IsString({ message: 'productId must be a string' })
    @IsMongoId({ message: 'productId must be a valid ObjectId' })
    @IsNotEmpty({ message: 'productId is required' })
    productId: string;

    @Type(() => Number)
    @IsNumber({}, { message: 'quantity must be a number' })
    @IsNotEmpty({ message: 'quantity is required' })
    quantity: number;
}

export class ShippingFeeGhnDto {
    @IsArray({ message: 'listProductOrder must be an array' })
    @ArrayMinSize(1, { message: 'listProductOrder must contain at least one product' })
    @ValidateNested({ each: true })
    @Type(() => ProductOrder)
    listProductOrder: ProductOrder[];

    @Type(() => Number)
    @IsNumber({}, { message: 'toDistrictId must be a number' })
    @IsNotEmpty({ message: 'toDistrictId is required' })
    toDistrictId: number;

    @IsString({ message: 'toWardCode must be a string' })
    @IsNotEmpty({ message: 'toWardCode is required' })
    toWardCode: string;
}

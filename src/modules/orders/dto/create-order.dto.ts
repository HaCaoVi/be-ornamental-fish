import {
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Min,
    ValidateNested,
    ArrayMinSize,
    IsEnum,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EPaymentMethod } from '@common/types/type';

export class CreateOrderItemDto {
    @IsString({ message: 'name must be a string' })
    @IsNotEmpty({ message: 'name cannot be empty' })
    name: string;

    @IsMongoId({ message: 'product must be a valid ObjectId' })
    @IsNotEmpty({ message: 'product cannot be empty' })
    productId: string;

    @IsNumber({}, { message: 'quantity must be a number' })
    @Min(1, { message: 'quantity must be greater than or equal to 1' })
    @IsNotEmpty({ message: 'quantity cannot be empty' })
    quantity: number;
}

export class CreatePaymentDto {
    @IsEnum(EPaymentMethod, { message: `method must be one of: ${Object.values(EPaymentMethod).join(', ')}` })
    @IsNotEmpty({ message: 'method cannot be empty' })
    method: EPaymentMethod;

    @IsString({ message: 'transactionId must be a string' })
    @IsOptional()
    transactionId?: string;
}

export class CreateOrderDto {
    @ValidateNested()
    @Type(() => CreatePaymentDto)
    @IsNotEmpty({ message: 'payment cannot be empty' })
    payment: CreatePaymentDto;

    @IsString({ message: 'fullname must be a string' })
    @IsNotEmpty({ message: 'fullname cannot be empty' })
    fullname: string

    @IsPhoneNumber('VN', { message: 'phone must be a valid Vietnamese phone number' })
    @IsNotEmpty({ message: 'phone cannot be empty' })
    phone: string;

    @IsString({ message: 'address must be a string' })
    @Matches(/^[^-]+-\d+-\w+$/, {
        message: 'Address must be in format "provinceId-toDistrictId-toWardCode"'
    })
    @IsNotEmpty({ message: 'address cannot be empty' })
    address: string;

    @IsOptional()
    @IsString({ message: 'note must be a string' })
    note?: string;

    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    @ArrayMinSize(1, { message: 'There must be at least one product in the order' })
    orderItems: CreateOrderItemDto[];
}

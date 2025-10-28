import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCartDto {
  @IsNotEmpty({ message: 'product is required!' })
  @IsMongoId({ message: 'product must be a valid ObjectId!' })
  product: Types.ObjectId;

  @IsNumber({}, { message: 'quantity must be a number' })
  @Min(0, { message: 'quantity cannot be less than 0' })
  @IsNotEmpty({ message: 'quantity is required' })
  quantity: number;
}

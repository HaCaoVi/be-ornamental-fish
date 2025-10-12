import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(
    OmitType(CreateProductDto, ['quantity', "gallery"] as const),
) { }

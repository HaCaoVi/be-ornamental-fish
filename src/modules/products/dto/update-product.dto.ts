import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateFishDto } from './create-product.dto';

export class UpdateFishDto extends PartialType(
    OmitType(CreateFishDto, ['quantity', "gallery"] as const),
) { }

import { PartialType } from '@nestjs/mapped-types';
import { CreateFishDto } from './create-product.dto';

export class UpdateFishDto extends PartialType(CreateFishDto) { }

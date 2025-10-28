import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDetailDto } from './create-category.dto';

export class UpdateCategoryDetailDto extends PartialType(
  CreateCategoryDetailDto,
) {}

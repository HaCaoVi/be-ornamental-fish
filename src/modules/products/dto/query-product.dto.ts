import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @IsNotEmpty({ message: 'category is required!' })
  @IsMongoId({ message: 'category must be a valid ObjectId!' })
  category: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  // @Transform(({ value }) => {
  //     try {
  //         return typeof value === "string" ? JSON.parse(value) : value;
  //     } catch {
  //         return value;
  //     }
  // })
  filters?: Record<string, any>;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'current must be an integer' })
  @Min(1)
  current?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize must be an integer' })
  @Min(1)
  @Max(50)
  pageSize?: number;
}

import { IsMongoId, IsNotEmpty, IsString } from "class-validator";

export class CreateCategoryDto {
    @IsNotEmpty({ message: 'name is required!' })
    name: string;
}

export class CreateCategoryDetailDto {
    @IsString({ message: 'name must be a string' })
    @IsNotEmpty({ message: 'name is required!' })
    name: string;

    @IsNotEmpty({ message: 'category is required!' })
    @IsMongoId({ message: 'category must be a valid ObjectId!' })
    category: string;
}

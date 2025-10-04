import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class UploadImageDto {
    @IsString({ message: 'folderName must be a string' })
    @IsNotEmpty({ message: 'folderName is required!' })
    folderName: string;

    @IsArray({ message: 'oldFileName must be an array' })
    @IsString({ each: true, message: 'Each oldFileName must be a string' })
    @IsNotEmpty({ each: true, message: 'oldFileName cannot contain empty strings' })
    oldFileName: string[];
}

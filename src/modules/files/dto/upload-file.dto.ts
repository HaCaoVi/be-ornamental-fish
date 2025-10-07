import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UploadFileDto {
    @IsString({ message: 'folderName must be a string' })
    @IsNotEmpty({ message: 'folderName is required!' })
    folderName: string;

    @IsString({ each: true, message: 'Each oldFileName must be a string' })
    @IsOptional({ each: true, message: 'oldFileName cannot contain empty strings' })
    oldFileName: string;
}

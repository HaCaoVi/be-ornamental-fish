import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';


export class ActiveAccountDto {
    @IsMongoId({ message: 'userId must be a valid ObjectId!' })
    @IsNotEmpty({ message: 'userId is required!' })
    userId: string;

    @IsNotEmpty({ message: 'code is required!' })
    @IsString({ message: 'code invalid!' })
    code: string;
}
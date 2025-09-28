import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateRoleDto {
    @IsNotEmpty({ message: 'name is required' })
    @IsString({ message: 'name must be a string' })
    name: string;

    @IsNotEmpty({ message: 'description is required' })
    @IsString({ message: 'description must be a string' })
    description: string;

    @IsNotEmpty({ message: 'isActive is required' })
    @IsBoolean({ message: 'isActive must be a boolean value' })
    isActive: boolean;
}
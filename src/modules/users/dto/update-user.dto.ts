import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(
    OmitType(CreateUserDto, ['email', 'password'] as const),
) {
    @IsOptional()
    @IsBoolean({ message: "isBanned must be a valid boolean" })
    isBanned: boolean;

    @IsOptional()
    @IsBoolean({ message: "isDeleted must be a valid boolean" })
    isDeleted: boolean;
}

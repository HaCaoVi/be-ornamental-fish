import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) {
  @IsOptional()
  @IsBoolean({ message: 'isBanned must be a valid boolean' })
  isBanned: boolean;
}

export class UpdateAvatarDto {
  @IsString({ message: 'newAvatar must be a string' })
  @IsNotEmpty({ message: 'newAvatar is required!' })
  newAvatar: string;
}

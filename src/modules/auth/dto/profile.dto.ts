import { CreateUserDto } from '@modules/users/dto/create-user.dto';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'oldPassword is required!' })
  @IsString({ message: 'oldPassword invalid!' })
  oldPassword: string;

  @IsNotEmpty({ message: 'newPassword is required!' })
  @IsString({ message: 'newPassword invalid!' })
  newPassword: string;
}

export class UpdateProfileUserDto extends PartialType(
  OmitType(CreateUserDto, [
    'email',
    'password',
    'role',
    'isActivated',
  ] as const),
) {}

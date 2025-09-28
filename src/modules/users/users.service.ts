import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { AccountType, User } from './schemas/user.schema';
import { hashBcrypt } from '@common/helpers/security.helper';
import type { UserModelType } from '@modules/users/schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: UserModelType,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...rest } = createUserDto

      const hashPass = await hashBcrypt(password);
      const newUser = await this.userModel.create({
        ...rest,
        password: hashPass,
        accountType: AccountType.LOCAL,
      })

      return {
        id: newUser._id,
        createdAt: newUser.createdAt
      };
    } catch (error) {
      this.logger.error("Created user error: " + error.message, error.stack);
      if (error?.code === 11000) {
        throw new BadRequestException("Email already exists!");
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

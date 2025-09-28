import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { hashBcrypt } from '@common/helpers/security.helper';
import type { UserModelType } from '@modules/users/schemas/user.schema';
import type { IToken, PaginatedResult } from '@common/interfaces/customize.interface';
import { AccountType } from '@common/types/type';
import { buildPopulateConfigFromStrings } from '@common/helpers/mongoose-populate.helper';
import { normalizeFilters, normalizeSort } from '@common/helpers/convert.helper';
import { Types } from 'mongoose';
import { buildMeta } from '@common/helpers/customize.helper';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: UserModelType,
  ) { }

  async create(author: IToken, createUserDto: CreateUserDto) {
    try {
      const { password, ...rest } = createUserDto

      const hashPass = await hashBcrypt(password);
      const newUser = await this.userModel.create({
        ...rest,
        password: hashPass,
        accountType: AccountType.LOCAL,
        createdBy: author.sub
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

  async findAll(current: number, pageSize: number, query: Record<string, any> = {}): Promise<PaginatedResult<User>> {
    try {
      if (!current) current = 1
      if (!pageSize || pageSize > 50) pageSize = 10

      const { sort, populate, fields, filters, search } = query
      const populateConfig = buildPopulateConfigFromStrings(populate, fields)
      const normalizedFilters = normalizeFilters(filters);
      const normalizedSort = normalizeSort(sort, ["createdAt", "updatedAt", "email", "name"]);

      if (search) {
        const regex = new RegExp(search, "i");
        normalizedFilters.$or = [
          Types.ObjectId.isValid(search) ? { _id: new Types.ObjectId(search + "") } : null,
          { name: regex },
          { email: regex },
        ].filter(Boolean);
      }

      const skip = (current - 1) * pageSize;

      const [totalItems, result] = await Promise.all([
        this.userModel.countDocumentsSoftDelete(normalizedFilters),
        this.userModel
          .find(normalizedFilters)
          .skip(skip)
          .limit(pageSize)
          .sort(normalizedSort)
          .select("-password -refreshToken")
          .populate(populateConfig)
          .lean<User[]>()
          .exec()
      ]);

      return {
        meta: buildMeta(current, pageSize, totalItems),
        result
      };
    } catch (error) {
      this.logger.error("List user error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.userModel
        .findById(id)
        .select("-password -refreshToken")
        .populate({
          path: 'role',
          select: "_id name"
        })
        .lean<User>()
        .exec();
      if (!user) throw new NotFoundException(`User with id ${id} not found`);
      return user;
    } catch (error) {
      this.logger.error("Get user error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAvatarDto, UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, type UserModelType } from './schemas/user.schema';
import { hashBcrypt } from '@common/helpers/security.helper';
import type { IToken, PaginatedResult } from '@common/interfaces/customize.interface';
import { EAccountType } from '@common/types/type';
import { normalizeSort, parseFilters } from '@common/helpers/convert.helper';
import { Types } from 'mongoose';
import { buildMeta } from '@common/helpers/helper';
import { ConfigService } from '@nestjs/config';
import { RolesService } from '@modules/roles/roles.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: UserModelType,
    private configService: ConfigService,
    private roleService: RolesService
  ) { }

  async create(author: IToken, createUserDto: CreateUserDto) {
    try {
      const { password, role, ...rest } = createUserDto
      const roleExist = await this.roleService.isRoleExist(role);
      if (!roleExist) {
        throw new NotFoundException(`Role with id ${role} not found!`)
      }
      const hashPass = await hashBcrypt(password);
      const newUser = await this.userModel.create({
        ...rest,
        role,
        password: hashPass,
        accountType: EAccountType.LOCAL,
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

      const { sort, filters, search } = query
      const normalizedFilters = parseFilters(filters)
      const normalizedSort = normalizeSort(sort, ["createdAt", "updatedAt", "email", "name"]);

      if (search) {
        const regex = new RegExp(search, "i");
        normalizedFilters.$or = [
          Types.ObjectId.isValid(search) ? { _id: new Types.ObjectId(search + '') } : null,
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
          .populate({
            path: "role",
            select: "_id name"
          })
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

  async update(author: IToken, id: Types.ObjectId, updateUserDto: UpdateUserDto) {
    try {
      const updated = await this.userModel.updateOne(
        { _id: id, email: { $ne: this.configService.get<string>("ROOT_ADMIN_ACCOUNT") } },
        { ...updateUserDto, updatedBy: author.sub, bannedBy: updateUserDto.isBanned ? author.sub : null },
        { runValidators: true }
      );
      if (updated.matchedCount === 0) {
        throw new NotFoundException(`User with id ${id} not found or is protected`);
      }
      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount
      };
    } catch (error) {
      this.logger.error("Updated user error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async remove(author: IToken, id: Types.ObjectId) {
    try {
      const deleted = await this.userModel.softDeleteOne(
        { _id: id, email: { $ne: this.configService.get<string>("ROOT_ADMIN_ACCOUNT") } }, author.sub.toString()
      );
      if (deleted.matchedCount === 0) {
        throw new NotFoundException(`User with id ${id} not found or cannot be delete this user!`);
      }
      return {
        success: true,
        _id: id
      };
    } catch (error) {
      this.logger.error("Deleted user error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async updateAvatar(userId: Types.ObjectId, updateAvatar: UpdateAvatarDto) {
    try {
      const updated = await this.userModel.updateOne(
        { _id: userId },
        { avatar: updateAvatar.newAvatar, updatedBy: userId },
        { runValidators: true }
      );
      if (updated.matchedCount === 0) {
        throw new NotFoundException(`User with id ${userId} not found or is protected`);
      }
      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount
      };
    } catch (error) {
      this.logger.error("Updated avatar error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }
}

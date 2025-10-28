import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from './schemas/role.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  async isRoleExist(roleId: Types.ObjectId) {
    return !!(await this.roleModel.exists({ _id: roleId }));
  }

  async findAll(): Promise<Role[]> {
    try {
      const result = await this.roleModel
        .find()
        .select('_id name')
        .lean<Role[]>()
        .exec();
      return result;
    } catch (error) {
      this.logger.error('List role error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findOne(id: Types.ObjectId): Promise<Role> {
    try {
      const role = await this.roleModel
        .findById(id)
        .select('_id name')
        .lean<Role>()
        .exec();
      if (!role) throw new NotFoundException(`Role with id ${id} not found`);
      return role;
    } catch (error) {
      this.logger.error('Get role error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }
}

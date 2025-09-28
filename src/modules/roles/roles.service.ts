import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from './schemas/role.schema';
import { Model } from 'mongoose';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  constructor(
    @InjectModel(Role.name) private roleModel: Model<Role>,
  ) { }


  async findAll(): Promise<Role[]> {
    try {
      const result = await this.roleModel
        .find()
        .lean<Role[]>()
        .exec()
      return result
    } catch (error) {
      this.logger.error("List role error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findOne(id: string): Promise<Role> {
    try {
      const role = await this.roleModel
        .findById(id)
        .lean<Role>()
        .exec();
      if (!role) throw new NotFoundException(`Role with id ${id} not found`);
      return role;
    } catch (error) {
      this.logger.error("Get role error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }
}

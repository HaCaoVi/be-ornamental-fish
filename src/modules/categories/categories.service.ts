import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './schemas/category.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return this.categoryModel.create({ ...createCategoryDto })
    } catch (error) {
      this.logger.error("Create category error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      const result = await this.categoryModel
        .find()
        .select("_id name")
        .lean<Category[]>()
        .exec()
      return result
    } catch (error) {
      this.logger.error("List role error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findOne(id: string): Promise<Category> {
    try {
      const role = await this.categoryModel
        .findById(id)
        .select("_id name")
        .lean<Category>()
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

import { BadRequestException, forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateCategoryDetailDto, CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './schemas/category.schema';
import { ClientSession, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CategoryDetail, type CategoryDetailModelType } from './schemas/category-detail.schema';
import { IToken } from '@common/interfaces/customize.interface';
import { UpdateCategoryDetailDto } from './dto/update-category.dto';
import { ProductsService } from '@modules/products/products.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(CategoryDetail.name) private categoryDetailModel: CategoryDetailModelType,
    @Inject(forwardRef(() => ProductsService)) private productService: ProductsService
  ) { }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    try {
      return this.categoryModel.create({ ...createCategoryDto })
    } catch (error) {
      this.logger.error("Create category error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findAllCategory(): Promise<Category[]> {
    try {
      const result = await this.categoryModel
        .find()
        .select("_id name")
        .lean<Category[]>()
        .exec()
      return result
    } catch (error) {
      this.logger.error("List category error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findOneCategory(id: Types.ObjectId): Promise<Category> {
    try {
      const category = await this.categoryModel
        .findById(id)
        .select("_id name")
        .lean<Category>()
        .exec();
      if (!category) throw new NotFoundException(`category with id ${id} not found`);
      return category;
    } catch (error) {
      this.logger.error("Get category error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async isCategoryDetailExist(categoryDetailId: Types.ObjectId, session: ClientSession) {
    return !!(await this.categoryDetailModel.exists({ _id: categoryDetailId }).session(session));
  }

  async createCategoryDetail(author: IToken, createCategoryDetailDto: CreateCategoryDetailDto) {
    try {
      const { category, name } = createCategoryDetailDto
      const isCateExist = await this.categoryModel.exists({ _id: category });
      if (!isCateExist) {
        throw new NotFoundException(`Category with id ${category} not found!`);
      }
      const categoryDetail = await this.categoryDetailModel.create({ name, category, createdBy: author.sub })
      return {
        _id: categoryDetail._id,
        createdAt: categoryDetail.createdAt
      }
    } catch (error) {
      this.logger.error("Create category detail error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findAllCategoryDetail(categoryId: Types.ObjectId): Promise<CategoryDetail[]> {
    try {
      const result = await this.categoryDetailModel
        .find({ category: categoryId })
        .select("_id name")
        .lean<CategoryDetail[]>()
        .exec()
      return result
    } catch (error) {
      this.logger.error("List category detail error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async updateCategoryDetail(author: IToken, id: Types.ObjectId, updateCategoryDetailDto: UpdateCategoryDetailDto) {
    try {
      const updated = await this.categoryDetailModel.updateOne({ _id: id }, { ...updateCategoryDetailDto, updatedBy: author.sub });
      if (updated.matchedCount === 0) {
        throw new NotFoundException(`Category detail with id ${id} not found!`);
      }
      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount
      };
    } catch (error) {
      this.logger.error("Update category detail error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async deleteCategoryDetail(author: IToken, id: Types.ObjectId) {
    try {
      const productCount = await this.productService.countProductHasCategoryDetailId(id);
      if (productCount > 0) {
        throw new BadRequestException(`Have ${productCount} product(s) using category detail id ${id}`)
      }
      return this.categoryDetailModel.softDeleteOne({ _id: id }, author.sub.toString())
    } catch (error) {
      this.logger.error("Delete category detail error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }
}

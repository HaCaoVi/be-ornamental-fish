import { BadRequestException, forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateCategoryDetailDto, CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './schemas/category.schema';
import { ClientSession, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CategoryDetail, type CategoryDetailModelType } from './schemas/category-detail.schema';
import { IToken, PaginatedResult } from '@common/interfaces/customize.interface';
import { UpdateCategoryDetailDto } from './dto/update-category.dto';
import { ProductsService } from '@modules/products/products.service';
import { buildMeta } from '@common/helpers/customize.helper';
import { parseFilters } from '@common/helpers/convert.helper';

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

  async isCategoryDetailExist(categoryDetailId: Types.ObjectId) {
    return !!(await this.categoryDetailModel.exists({ _id: categoryDetailId }));
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
      if (error?.code === 11000) {
        throw new BadRequestException("Category detail name already exists!");
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findAllCategoryDetail(current: number, pageSize: number, query: any): Promise<PaginatedResult<CategoryDetail>> {
    try {
      if (!current) current = 1
      if (!pageSize || pageSize > 50) pageSize = 10
      const { filters, search } = query

      const normalizedFilters = parseFilters(filters)
      const skip = (current - 1) * pageSize;

      if (search) {
        const regex = new RegExp(search, "i");
        normalizedFilters.$or = [
          Types.ObjectId.isValid(search) ? { _id: new Types.ObjectId(search + '') } : null,
          { name: regex },
        ].filter(Boolean);
      }

      const [totalItems, result] = await Promise.all([
        this.categoryDetailModel.countDocumentsSoftDelete(normalizedFilters),
        this.categoryDetailModel
          .find(normalizedFilters)
          .skip(skip)
          .limit(pageSize)
          .populate([
            {
              path: "category",
              select: "_id name",
            },
            {
              path: "createdBy",
              select: "_id name email",
              populate: {
                path: "role",
                select: "_id name"
              }
            },
            {
              path: "updatedBy",
              select: "_id name email",
              populate: {
                path: "role",
                select: "_id name"
              }
            }
          ])
          .sort("createdAt")
          .lean<CategoryDetail[]>()
          .exec()
      ]);

      return {
        meta: buildMeta(current, pageSize, totalItems),
        result
      };
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
        throw new BadRequestException(`Have ${productCount} product(s) using this category!`)
      }
      const deleted = await this.categoryDetailModel.softDeleteOne({ _id: id }, author.sub.toString())
      if (deleted.matchedCount === 0) {
        throw new NotFoundException(`Category detail with id ${id} not found!`);
      }
      return {
        success: true,
        _id: id
      }
    } catch (error) {
      this.logger.error("Delete category detail error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }
}

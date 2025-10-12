import { BadRequestException, forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateFishDto, CreateFoodDto } from './dto/create-product.dto';
import { UpdateFishDto } from './dto/update-product.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Product, type ProductModelType } from './schemas/product.schema';
import type { IToken, PaginatedResult } from '@common/interfaces/customize.interface';
import { Connection, Model, Types } from 'mongoose';
import { Stock } from './schemas/stock.schema';
import { Gallery } from './schemas/gallery.schema';
import { FishesService } from '@modules/fishes/fishes.service';
import { CategoriesService } from '@modules/categories/categories.service';
import { buildMeta } from '@common/helpers/customize.helper';
import { normalizeSort, parseFilters } from '@common/helpers/convert.helper';
import { FoodsService } from '@modules/foods/foods.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Product.name) private productModel: ProductModelType,
    @InjectModel(Gallery.name) private galleryModel: Model<Gallery>,
    @InjectModel(Stock.name) private stockModel: Model<Stock>,
    @Inject(forwardRef(() => CategoriesService)) private categoryService: CategoriesService,
    private fishService: FishesService,
    private foodService: FoodsService,
  ) { }

  async countProductHasCategoryDetailId(categoryDetailId: Types.ObjectId) {
    return this.productModel.countDocumentsSoftDelete({ categoryDetail: categoryDetailId });
  }

  async createFish(author: IToken, createFishDto: CreateFishDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const { color, size, origin, gallery, quantity, categoryDetail, ...rest } = createFishDto;
      const categoryDetailExist = await this.categoryService.isCategoryDetailExist(categoryDetail, session);
      if (!categoryDetailExist) {
        throw new NotFoundException(`Category detail with id ${categoryDetail} not found!`);
      }

      const [newFish] = await this.productModel.create([{ ...rest, categoryDetail, createdBy: author.sub }], { session });

      await this.fishService.create(newFish._id, color, size, origin, session);

      await this.stockModel.create(
        [{ product: newFish._id, quantity }],
        { session }
      );

      if (gallery && gallery.length > 0) {
        await this.galleryModel.insertMany(
          gallery.map(img => ({ imageUrl: img, product: newFish._id })),
          { session }
        );
      }
      await session.commitTransaction();
      return { id: newFish._id, createdAt: newFish.createdAt };
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch { }
      this.logger.error("Created fish error: " + error.message, error.stack);
      if (error?.code === 11000) throw new BadRequestException("Code already exists!");
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Something went wrong!");
    } finally {
      session.endSession();
    }
  }

  async findAll(
    current: number,
    pageSize: number,
    query: Record<string, any> = {}
  ): Promise<PaginatedResult<Product>> {
    try {
      if (!current) current = 1
      if (!pageSize || pageSize > 50) pageSize = 10
      const { sort, filters, search, category } = query;
      const normalizedFilters = parseFilters(filters);
      const normalizedSort = normalizeSort(sort, ["createdAt", "updatedAt", "name", "price", "discount"]);

      const skip = (current - 1) * pageSize;
      const pipeline: any[] = [];

      let baseMatch: any = { isDeleted: false, ...normalizedFilters };
      if (search) {
        const isCodeSearch = /^[A-Z0-9-]+$/.test(search.trim());
        if (isCodeSearch) {
          baseMatch.code = { $regex: `^${search}`, $options: "i" };
        } else {
          pipeline.push({ $match: { $text: { $search: search } } });
        }
      }

      if (!pipeline.length) pipeline.push({ $match: baseMatch });
      else pipeline.push({ $match: baseMatch }); // combine filters with text search results

      pipeline.push(
        {
          $lookup: {
            from: "categorydetails",
            let: { categoryDetailId: "$categoryDetail" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$categoryDetailId"] } } },
              ...(category ? [{ $match: { category: new Types.ObjectId(category + "") } }] : []),
              { $project: { _id: 1, name: 1, category: 1 } },
            ],
            as: "categoryDetail",
          },
        },
        { $unwind: "$categoryDetail" },
        {
          $lookup: {
            from: "stocks",
            localField: "_id",
            foreignField: "product",
            pipeline: [{ $project: { _id: 1, quantity: 1, sold: 1 } }],
            as: "stock",
          },
        },
        { $unwind: { path: "$stock", preserveNullAndEmptyArrays: true } }
      );

      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await this.productModel.aggregate(countPipeline).exec();

      const totalItems = countResult[0]?.total || 0;

      if (normalizedSort && Object.keys(normalizedSort).length > 0)
        pipeline.push({ $sort: normalizedSort });

      pipeline.push({ $skip: skip }, { $limit: pageSize });

      const result = await this.productModel.aggregate(pipeline).exec();
      return {
        meta: buildMeta(current, pageSize, totalItems),
        result,
      };
    } catch (error) {
      this.logger.error("List product error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Something went wrong!");
    }
  }

  async findOne(productId: Types.ObjectId) {
    try {
      const pipeline: any[] = [
        { $match: { _id: new Types.ObjectId(productId), isDeleted: false } },
        {
          $lookup: {
            from: "categorydetails",
            localField: "categoryDetail",
            foreignField: "_id",
            pipeline: [
              { $project: { _id: 1, name: 1, category: 1 } }
            ],
            as: "categoryDetail"
          }
        },
        { $unwind: "$categoryDetail" },
        {
          $lookup: {
            from: "stocks",
            localField: "_id",
            foreignField: "product",
            as: "stock"
          }
        },
        { $unwind: { path: "$stock", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "fish",
            localField: "_id",
            foreignField: "product",
            as: "fish"
          }
        },
        {
          $lookup: {
            from: "food",
            localField: "_id",
            foreignField: "product",
            as: "food"
          }
        },
        {
          $lookup: {
            from: "gallery",
            localField: "_id",
            foreignField: "product",
            as: "gallery"
          }
        }
      ];

      const [product] = await this.productModel.aggregate(pipeline).exec();
      return product || null;
    } catch (error) {
      this.logger.error("Get product detail error: " + error.message, error.stack);
      throw new InternalServerErrorException("Something went wrong!");
    }
  }

  async update(author: IToken, productId: Types.ObjectId, updateFishDto: UpdateFishDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const { color, size, origin, categoryDetail, ...rest } = updateFishDto;

      if (categoryDetail) {
        const exist = await this.categoryService.isCategoryDetailExist(categoryDetail, session);
        if (!exist) {
          throw new NotFoundException(`Category detail with id ${categoryDetail} not found!`);
        }
      }
      const updated = await this.productModel.updateOne(
        { _id: productId },
        { ...rest, updatedBy: author.sub },
        { runValidators: true, session }
      );

      if (color || size || origin) {
        await this.fishService.update(productId, color, size, origin, session);
      }

      if (updated.matchedCount === 0) {
        throw new NotFoundException(`Fish with id ${productId} not found`);
      }
      await session.commitTransaction();

      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount
      };
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch { }
      this.logger.error("Updated fish error: " + error.message, error.stack);
      if (error?.code === 11000) throw new BadRequestException("Code already exists!");
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    } finally {
      session.endSession();
    }
  }

  async removeProduct(author: IToken, id: Types.ObjectId) {
    try {
      const deleted = await this.productModel.softDeleteOne({ _id: id }, author.sub.toString())
      if (deleted.matchedCount === 0) {
        throw new NotFoundException(`Product with id ${id} not found!`);
      }
      return {
        success: true,
        _id: id
      }
    } catch (error) {
      this.logger.error("Delete product error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async createFood(author: IToken, createFoodDto: CreateFoodDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const { weight, pelletSize, gallery, quantity, categoryDetail, ...rest } = createFoodDto;
      const categoryDetailExist = await this.categoryService.isCategoryDetailExist(categoryDetail, session);
      if (!categoryDetailExist) {
        throw new NotFoundException(`Category detail with id ${categoryDetail} not found!`);
      }

      const [newFood] = await this.productModel.create([{ ...rest, categoryDetail, createdBy: author.sub }], { session });

      await this.foodService.create(newFood._id, weight, pelletSize, session);

      await this.stockModel.create(
        [{ product: newFood._id, quantity }],
        { session }
      );

      if (gallery && gallery.length > 0) {
        await this.galleryModel.insertMany(
          gallery.map(img => ({ imageUrl: img, product: newFood._id })),
          { session }
        );
      }
      await session.commitTransaction();
      return { id: newFood._id, createdAt: newFood.createdAt };
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch { }
      this.logger.error("Created fish error: " + error.message, error.stack);
      if (error?.code === 11000) throw new BadRequestException("Code already exists!");
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Something went wrong!");
    } finally {
      session.endSession();
    }
  }
}

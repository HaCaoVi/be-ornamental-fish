import { BadRequestException, forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateFishDto } from './dto/create-product.dto';
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
import { pipeline } from 'stream';

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
      const fishDataSchemaOnly = {
        name: createFishDto.name,
        code: createFishDto.code,
        description: createFishDto.description,
        price: createFishDto.price,
        discount: createFishDto.discount,
        mainImageUrl: createFishDto.mainImageUrl,
        mainVideoUrl: createFishDto.mainVideoUrl,
        isActivated: createFishDto.isActivated,
        categoryDetail: new Types.ObjectId(categoryDetail),
        createdBy: new Types.ObjectId(author.sub),
      };

      const newFish = new this.productModel(fishDataSchemaOnly);
      await newFish.save({ session });


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
      if (!current) current = 1;
      if (!pageSize || pageSize > 50) pageSize = 10;

      const { sort, filters, search, categoryId } = query;
      const normalizedFilters = parseFilters(filters);
      const normalizedSort = normalizeSort(sort, ["createdAt", "updatedAt", "name"]);

      const skip = (current - 1) * pageSize;

      const pipeline: any[] = [
        { $match: { isDeleted: false, ...normalizedFilters } },

        {
          $lookup: {
            from: "categorydetails",
            let: { categoryDetailId: "$categoryDetail" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$categoryDetailId"] } } },
              ...(categoryId
                ? [{ $match: { category: new Types.ObjectId(categoryId + "") } }]
                : []),
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
            pipeline: [
              {
                $project: { _id: 1, quantity: 1, sold: 1 },
              }
            ],
            as: "stock"
          }
        },
        { $unwind: { path: "$stock", preserveNullAndEmptyArrays: true } } // nếu chưa có stock vẫn trả về product
      ];

      if (search) {
        pipeline.push({
          $match: { $text: { $search: search } }
        });
      }

      if (normalizedSort && Object.keys(normalizedSort).length > 0) {
        pipeline.push({ $sort: normalizedSort });
      }

      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await this.productModel.aggregate(countPipeline).exec();
      const totalItems = countResult[0]?.total || 0;

      pipeline.push({ $skip: skip }, { $limit: pageSize });

      const result = await this.productModel.aggregate(pipeline).exec();

      return {
        meta: buildMeta(current, pageSize, totalItems),
        result
      };
    } catch (error) {
      this.logger.error("List product error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Something went wrong!");
    }
  }

  findOne(id: Types.ObjectId) {
    return `This action returns a #${id} product`;
  }

  update(id: Types.ObjectId, updateProductDto: UpdateFishDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: Types.ObjectId) {
    return `This action removes a #${id} product`;
  }
}

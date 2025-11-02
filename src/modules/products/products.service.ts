import {
  BadRequestException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Product, type ProductModelType } from './schemas/product.schema';
import type {
  IToken,
  PaginatedResult,
} from '@common/interfaces/customize.interface';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Stock } from './schemas/stock.schema';
import { CategoriesService } from '@modules/categories/categories.service';
import { buildMeta } from '@common/helpers/helper';
import { normalizeSort, parseFilters } from '@common/helpers/convert.helper';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductOrder } from '@modules/ghn/dto/create-ghn.dto';
import { CreateOrderItemDto } from '@modules/orders/dto/create-order.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Product.name) private productModel: ProductModelType,
    @InjectModel(Stock.name) private stockModel: Model<Stock>,
    @Inject(forwardRef(() => CategoriesService))
    private categoryService: CategoriesService,
  ) { }

  async countProductHasCategoryDetailId(categoryDetailId: Types.ObjectId) {
    return this.productModel.countDocumentsSoftDelete({
      categoryDetail: categoryDetailId,
    });
  }

  async create(author: IToken, createFishDto: CreateProductDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const { quantity, categoryDetail, ...rest } = createFishDto;
      const categoryDetailExist =
        await this.categoryService.isCategoryDetailExist(categoryDetail);
      if (!categoryDetailExist) {
        throw new NotFoundException(
          `Category detail with id ${categoryDetail} not found!`,
        );
      }

      const [newProduct] = await this.productModel.create(
        [{ ...rest, categoryDetail, createdBy: author.sub }],
        { session },
      );

      await this.stockModel.create([{ product: newProduct._id, quantity }], {
        session,
      });

      await session.commitTransaction();
      return { id: newProduct._id, createdAt: newProduct.createdAt };
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch { }
      this.logger.error('Created product error: ' + error.message, error.stack);
      if (error?.code === 11000)
        throw new BadRequestException('Code already exists!');
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    } finally {
      session.endSession();
    }
  }

  async findAll(
    current?: number,
    pageSize?: number,
    query: Record<string, any> = {},
  ): Promise<PaginatedResult<Product>> {
    try {
      if (!current) current = 1;
      if (!pageSize || pageSize > 50) pageSize = 10;
      const { sort, filters, search, category } = query;
      const normalizedFilters = parseFilters(filters);
      const normalizedSort = normalizeSort(sort, [
        'createdAt',
        'updatedAt',
        'name',
        'price',
        'discount',
      ]);
      const skip = (current - 1) * pageSize;
      const pipeline: any[] = [];
      const {
        price,
        categoryDetail,
        sale = false,
        ...rest
      } = normalizedFilters;
      const baseMatch: any = { isDeleted: false, ...rest };
      if (sale) {
        baseMatch.discount = { $ne: 0 };
      }
      if (categoryDetail !== undefined && categoryDetail.length > 0) {
        const listCate = categoryDetail.map((x: string) => {
          return new Types.ObjectId(x);
        });
        baseMatch.categoryDetail = { $in: listCate };
      }
      if (Array.isArray(price) && price.length === 2) {
        const [min, max] = price.map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          baseMatch.price = { $gte: min, $lte: max };
        }
      }
      if (search) {
        const isCodeSearch = /^[A-Z0-9-]+$/.test(search.trim());
        if (isCodeSearch) {
          baseMatch.code = { $regex: `^${search}`, $options: 'i' };
        } else {
          pipeline.push({ $match: { $text: { $search: search } } });
        }
      }

      pipeline.push({ $match: baseMatch });

      pipeline.push(
        {
          $lookup: {
            from: 'categorydetails',
            let: { categoryDetailId: '$categoryDetail' },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$categoryDetailId'] } } },
              ...(category
                ? [{ $match: { category: new Types.ObjectId(category + '') } }]
                : []),
              { $project: { _id: 1, name: 1, category: 1 } },
            ],
            as: 'categoryDetail',
          },
        },
        { $unwind: '$categoryDetail' },
        {
          $lookup: {
            from: 'stocks',
            localField: '_id',
            foreignField: 'product',
            pipeline: [{ $project: { _id: 1, quantity: 1, sold: 1 } }],
            as: 'stock',
          },
        },
        { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
      );

      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await this.productModel
        .aggregate(countPipeline)
        .exec();

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
      this.logger.error('List product error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findOne(code: string) {
    try {
      const pipeline: any[] = [
        { $match: { code: code, isDeleted: false } },
        {
          $lookup: {
            from: 'categorydetails',
            localField: 'categoryDetail',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 1, name: 1, category: 1 } }],
            as: 'categoryDetail',
          },
        },
        { $unwind: '$categoryDetail' },
        {
          $lookup: {
            from: 'stocks',
            localField: '_id',
            foreignField: 'product',
            as: 'stock',
          },
        },
        { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'gallery',
            localField: '_id',
            foreignField: 'product',
            as: 'gallery',
          },
        },
      ];

      const [product] = await this.productModel.aggregate(pipeline).exec();
      return product || null;
    } catch (error) {
      this.logger.error(
        'Get product detail error: ' + error.message,
        error.stack,
      );
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async update(
    author: IToken,
    productId: Types.ObjectId,
    updateFishDto: UpdateProductDto,
  ) {
    try {
      const { categoryDetail, quantity, ...rest } = updateFishDto;

      if (categoryDetail) {
        const exist =
          await this.categoryService.isCategoryDetailExist(categoryDetail);
        if (!exist) {
          throw new NotFoundException(
            `Category detail with id ${categoryDetail} not found!`,
          );
        }
      }
      const updated = await this.productModel.updateOne(
        { _id: productId },
        { ...rest, updatedBy: author.sub },
        { runValidators: true },
      );

      if (quantity) {
        await this.stockModel.updateOne({ product: productId }, { quantity })
      }

      if (updated.matchedCount === 0) {
        throw new NotFoundException(`Product with id ${productId} not found`);
      }

      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Updated product error: ' + error.message, error.stack);
      if (error?.code === 11000)
        throw new BadRequestException('Code already exists!');
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async removeProduct(author: IToken, id: Types.ObjectId) {
    try {
      const deleted = await this.productModel.softDeleteOne(
        { _id: id },
        author.sub.toString(),
      );
      if (deleted.matchedCount === 0) {
        throw new NotFoundException(`Product with id ${id} not found!`);
      }
      return {
        success: true,
        _id: id,
      };
    } catch (error) {
      this.logger.error('Delete product error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async recommendProduct(
    categoryDetailId: Types.ObjectId,
    code: string,
    current = 1,
    pageSize = 20,
  ) {
    try {
      const skip = (current - 1) * pageSize;
      const match = {
        isDeleted: false,
        categoryDetail: new Types.ObjectId(categoryDetailId),
        code: { $ne: code },
      };

      const data = await this.productModel.aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'stocks',
            localField: '_id',
            foreignField: 'product',
            as: 'stock',
          },
        },
        { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
        { $skip: skip },
        { $limit: pageSize },
      ]);
      return data;
    } catch (error) {
      this.logger.error(
        'Recommend product error: ' + error.message,
        error.stack,
      );
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findListProductByListProductId(productIds: string[]) {
    return this.productModel
      .find({ _id: { $in: productIds } })
      .select('price discount height length width weight')
      .lean<Product[]>()
      .exec();
  }

  async calculateProductList(listProductOrder: ProductOrder[]) {
    try {
      const productIds = listProductOrder.map((item) => item.productId);

      const productList = await this.findListProductByListProductId(productIds)

      if (productList.length === 0) {
        return {
          height: 0,
          length: 0,
          width: 0,
          weight: 0,
          total: 0,
        };
      }

      const quantityMap = new Map(
        listProductOrder.map((item) => [item.productId, item.quantity]),
      );
      const summary = productList.reduce(
        (acc, p) => {
          return {
            height: Math.max(acc.height, p.height || 0),
            length: Math.max(acc.length, p.length || 0),
            width: Math.max(acc.width, p.width || 0),
            weight: acc.weight + (p.weight || 0) * (quantityMap.get(String(p._id)) || 1),
            total: acc.total + (p.price - p.discount) * (quantityMap.get(String(p._id)) || 1),
          };
        },
        { height: 0, length: 0, width: 0, weight: 0, total: 0 },
      );
      return summary
    } catch (error) {
      console.error('Error calculating product list:', error);
      return {
        height: 0,
        length: 0,
        width: 0,
        weight: 0,
        total: 0,
      };
    }
  }

  async checkStockByListProduct(listProductId: string[]) {
    return this.stockModel
      .find({ product: { $in: listProductId } })
      .select('quantity product _id')
      .populate("product")
      .lean<Stock[]>()
      .exec();
  }

  async checkStock(productId: string) {
    return this.stockModel.findOne({
      product: productId
    })
  }

  async checkNameProduct(productId: string) {
    return this.productModel.findById(productId)
  }

  async updateQuantity(orderItems: CreateOrderItemDto[], session?: ClientSession) {
    const bulkOps = orderItems.map(item => ({
      updateOne: {
        filter: {
          product: item.productId,
          quantity: { $gte: item.quantity }
        },
        update: {
          $inc: { quantity: -item.quantity },
        },
      },
    }));

    const result = await this.stockModel.bulkWrite(bulkOps, { session });

    const modifiedCount = result.modifiedCount ?? 0;
    if (modifiedCount < orderItems.length) {
      throw new BadRequestException('Some products are out of stock or have been updated concurrently.');
    }
  }

  async refundQuantityProduct(orderItems: any[], session: ClientSession) {
    await Promise.all(
      orderItems.map((item) =>
        this.productModel.updateOne(
          { _id: item.product },
          { $inc: { quantity: item.quantity } },
          { session }
        )
      )
    );
  }

}

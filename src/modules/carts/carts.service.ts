import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './schemas/cart.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stock } from '@modules/products/schemas/stock.schema';
import { PaginatedResult } from '@common/interfaces/customize.interface';
import { buildMeta } from '@common/helpers/helper';

@Injectable()
export class CartsService {
  private readonly logger = new Logger(CartsService.name);

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Stock.name) private stockModel: Model<Stock>,
  ) { }

  async create(userId: Types.ObjectId, createCartDto: CreateCartDto) {
    try {
      const { product, quantity } = createCartDto;
      const checkStock = await this.stockModel.findOne({ product });
      if (checkStock?.quantity === 0) {
        throw new BadRequestException('Out of stock');
      }
      await this.cartModel.findOneAndUpdate(
        { user: userId, product },
        {
          $setOnInsert: { user: userId, product },
          $inc: { quantity },
        },
        {
          upsert: true,
        },
      );
      return true;
    } catch (error) {
      this.logger.error('Created cart error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async countCart(userId: Types.ObjectId) {
    try {
      return this.cartModel.countDocuments({ user: userId });
    } catch (error) {
      this.logger.error('Count cart error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findAll(
    userId: Types.ObjectId,
    current: number,
    pageSize: number,
  ): Promise<PaginatedResult<Cart>> {
    try {
      if (!current) current = 1;
      if (!pageSize || pageSize > 50) pageSize = 10;
      const skip = (current - 1) * pageSize;

      const pipeline: any[] = [];
      const baseMatch = { user: new Types.ObjectId(userId) };

      pipeline.push({ $match: baseMatch });

      pipeline.push(
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'stocks',
            let: { productId: '$product._id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$product', '$$productId'] } } },
              { $project: { quantity: 1, _id: 1 } },
            ],
            as: 'product.stock',
          },
        },
        {
          $unwind: { path: '$product.stock', preserveNullAndEmptyArrays: true },
        },
      );
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await this.cartModel.aggregate(countPipeline).exec();
      const totalItems = countResult[0]?.total || 0;
      pipeline.push({ $skip: skip }, { $limit: pageSize });
      const result = await this.cartModel.aggregate(pipeline).exec();
      return {
        meta: buildMeta(current, pageSize, totalItems),
        result,
      };
    } catch (error) {
      this.logger.error('List cart error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async updateQuantity(cartId: Types.ObjectId, updateCartDto: UpdateCartDto) {
    try {
      const { product, quantity } = updateCartDto;
      const checkStock = await this.stockModel.findOne({ product: product })
      if (!checkStock || checkStock.quantity <= 0) {
        throw new BadRequestException("Insufficient stock!")
      }
      const updated = await this.cartModel.updateOne(
        { _id: cartId },
        { quantity },
      );
      if (updated.matchedCount === 0) {
        throw new NotFoundException(`Cart with id ${cartId} not found`);
      }
      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Updated cart error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async remove(id: Types.ObjectId) {
    try {
      await this.cartModel.findByIdAndDelete(id);
      return 'ok';
    } catch (error) {
      this.logger.error('Updated cart error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async clearCart(listCardId: string[]) {
    try {
      return this.cartModel.deleteMany({ _id: { $in: listCardId } })
    } catch (error) {
      this.logger.error('clear cart error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }
}

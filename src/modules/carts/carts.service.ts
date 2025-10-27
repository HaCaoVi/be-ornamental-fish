import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './schemas/cart.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stock } from '@modules/products/schemas/stock.schema';

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
        throw new BadRequestException("Out of stock")
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
      this.logger.error("Create cart error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }


  async countCart(userId: Types.ObjectId) {
    try {
      return this.cartModel.countDocuments({ user: userId })
    } catch (error) {
      this.logger.error("Count cart error: " + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  findAll() {
    return `This action returns all carts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }

  update(id: number, updateCartDto: UpdateCartDto) {
    return `This action updates a #${id} cart`;
  }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }
}

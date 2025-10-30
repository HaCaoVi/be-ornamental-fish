import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './schemas/order.schema';
import { ProductsService } from '@modules/products/products.service';
import { Payment } from './schemas/payment.schema';
import { GhnService } from '@modules/ghn/ghn.service';
import { v4 as uuidv4 } from 'uuid';
import { OrderItem } from './schemas/order-item.schema';
import { EPaymentStatus } from '@common/types/type';
import { CartsService } from '@modules/carts/carts.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItem>,
    private productService: ProductsService,
    private ghnService: GhnService,
    private cartService: CartsService
  ) { }

  async checkStockProduct(orderItems: CreateOrderItemDto[]) {
    const productIds = orderItems.map(item => item.productId);
    const stocks = await this.productService.checkStockByListProduct(productIds);

    const stockMap = new Map(stocks.map(s => [s.product._id.toString(), s]));

    for (const item of orderItems) {
      const stock = stockMap.get(item.productId.toString());
      if (!stock) throw new BadRequestException(`Product ${item.productId} does not exist.`);
      if (stock.quantity < item.quantity)
        throw new BadRequestException(`Product ${stock.product.name} has only ${stock.quantity} left, cannot order ${item.quantity}.`);
    }
    return stocks;
  }

  async create(userId: Types.ObjectId, createOrderDto: CreateOrderDto) {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const { orderItems, payment, listCartId, ...rest } = createOrderDto;
      const checkStock = await this.checkStockProduct(orderItems);
      const products = checkStock ? checkStock?.map(e => e.product) : []
      if (!products.length) throw new BadRequestException('No valid products found.');

      const [__, toDistrictIdStr, toWardCode] = rest.address.split("-");

      const [paymentItem, ghnShipping] = await Promise.all([
        this.paymentModel.create([{ ...payment, status: EPaymentStatus.UNPAID }], { session }),
        this.ghnService.shippingFee({ listProductOrder: orderItems, toDistrictId: +toDistrictIdStr, toWardCode })
      ]);

      const code = uuidv4();

      const [order] = await this.orderModel.create(
        [
          {
            ...rest,
            payment: paymentItem[0]._id,
            totalAmount: ghnShipping.totalAmount,
            shippingFee: ghnShipping.total,
            code,
            user: userId,
          },
        ],
        { session },
      );

      const orderItemDocs = products.map(product => {
        const qty = orderItems.find(i => i.productId.toString() === product._id.toString())?.quantity || 0;
        return {
          order: order._id,
          product: product._id,
          price: product.price,
          discount: product.discount || 0,
          quantity: qty,
        };
      });

      const createdOrderItems = await this.orderItemModel.insertMany(orderItemDocs, { session });

      await this.productService.updateQuantity(orderItems, session);
      await this.cartService.clearCart(listCartId)
      await session.commitTransaction();
      return { order, orderItems: createdOrderItems };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Created order error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    } finally {
      session.endSession();
    }
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}

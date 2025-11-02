import { BadRequestException, forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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
import { EPaymentMethod, EPaymentStatus, EStatus } from '@common/types/type';
import { CartsService } from '@modules/carts/carts.service';
import { PaginatedResult } from '@common/interfaces/customize.interface';
import { buildMeta } from '@common/helpers/helper';
import { normalizeSort, parseFilters } from '@common/helpers/convert.helper';
import { VnpayService } from '@modules/vnpay/vnpay.service';
import { Response } from 'express';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItem>,
    private productService: ProductsService,
    private ghnService: GhnService,
    private cartService: CartsService,
    @Inject(forwardRef(() => VnpayService))
    private vnpayService: VnpayService,
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

  async create(userId: Types.ObjectId, ipAddr: string, createOrderDto: CreateOrderDto) {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const { orderItems, payment, listCartId, ...rest } = createOrderDto;
      const checkStock = await this.checkStockProduct(orderItems);
      const products = checkStock ? checkStock?.map(e => e.product) : []
      if (!products.length) throw new BadRequestException('No valid products found.');

      const [__, toDistrictIdStr, toWardCode] = rest.address.code.split("-");

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
      await this.cartService.clearCart(listCartId, session)
      await session.commitTransaction();
      if (payment.method === EPaymentMethod.VN_PAY) {
        const totalFinal = ghnShipping.totalAmount + ghnShipping.total
        const vnpUrl = this.vnpayService.createLinkPaymentVNPay(order.code, totalFinal, ipAddr);
        return { redirectUrl: vnpUrl };
      }
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

  async findAll(
    current: number,
    pageSize: number,
    query: Record<string, any> = {},
  ): Promise<PaginatedResult<Order>> {
    try {
      if (!current) current = 1;
      if (!pageSize || pageSize > 50) pageSize = 10;

      const { sort, filters, search } = query;

      const normalizedFilters = parseFilters(filters);
      const normalizedSort = normalizeSort(sort, ['createdAt', 'updatedAt', 'fullname', 'code']);

      if (search) {
        const regex = new RegExp(search, 'i');
        normalizedFilters.$or = [
          Types.ObjectId.isValid(search) ? { _id: new Types.ObjectId(search + "") } : null,
          { code: regex },
          { fullname: regex },
          { 'user.email': regex },
        ].filter(Boolean);
      }

      const skip = (current - 1) * pageSize;

      const pipeline: any[] = [];

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      )

      // ✅ 1. Match
      pipeline.push({ $match: { ...normalizedFilters } });

      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'updatedBy',
            foreignField: '_id',
            as: 'updatedBy',
          },
        },
        { $unwind: { path: '$updatedBy', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'payments',
            localField: 'payment',
            foreignField: '_id',
            as: 'payment',
          },
        },
        { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'orderitems',
            let: { orderId: '$_id' },
            pipeline: [
              {
                $match: { $expr: { $eq: ['$order', '$$orderId'] } },
              },
              {
                $lookup: {
                  from: 'products',
                  localField: 'product',
                  foreignField: '_id',
                  as: 'product',
                },
              },
              {
                $unwind: { path: '$product', preserveNullAndEmptyArrays: true },
              },
              {
                $project: {
                  _id: 1,
                  quantity: 1,
                  price: 1,
                  discount: 1,
                  product: {
                    _id: 1,
                    code: 1,
                    name: 1,
                    mainImageUrl: 1,
                  },
                },
              },
            ],
            as: 'orderItems',
          },
        },
        {
          $project: {
            _id: 1,
            fullname: 1,
            code: 1,
            phone: 1,
            address: 1,
            note: 1,
            totalAmount: 1,
            shippingFee: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            'updatedBy._id': 1,
            'updatedBy.email': 1,
            'user._id': 1,
            'user.name': 1,
            'user.email': 1,
            'user.avatar': 1,
            'user.accountType': 1,
            payment: 1,
            orderItems: 1,
          },
        }
      );

      pipeline.push({ $sort: normalizedSort });

      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await this.orderModel.aggregate(countPipeline).exec();
      const totalItems = countResult[0]?.total || 0;
      pipeline.push({ $skip: skip }, { $limit: pageSize });
      const result = await this.orderModel.aggregate(pipeline).exec();
      return {
        meta: buildMeta(current, pageSize, totalItems),
        result,
      };
    } catch (error) {
      this.logger.error('List order error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findAllOfUser(
    userId: Types.ObjectId,
    current: number,
    pageSize: number,
    query: Record<string, any> = {},
  ): Promise<PaginatedResult<Order[]>> {
    try {
      if (!current) current = 1;
      if (!pageSize || pageSize > 50) pageSize = 10;
      const skip = (current - 1) * pageSize;
      const normalizedFilters = parseFilters(query.filters);
      const pipeline: any[] = [];
      const baseMatch = { user: new Types.ObjectId(userId), ...normalizedFilters };

      pipeline.push({ $match: baseMatch });

      pipeline.push(
        {
          $lookup: {
            from: 'payments',
            localField: 'payment',
            foreignField: '_id',
            as: 'payment',
          },
        },
        { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'orderitems',
            let: { orderId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$order', '$$orderId'] },
                },
              },
              {
                $lookup: {
                  from: 'products',
                  localField: 'product',
                  foreignField: '_id',
                  as: 'product',
                },
              },
              {
                $unwind: {
                  path: '$product',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 1,
                  product: {
                    _id: 1,
                    code: 1,
                    name: 1,
                    mainImageUrl: 1,
                  },
                  quantity: 1,
                  price: 1,
                  discount: 1,
                },
              },
            ],
            as: 'orderItems',
          },
        }
      );

      pipeline.push({ $sort: { createdAt: -1 } });

      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await this.orderModel.aggregate(countPipeline).exec();
      const totalItems = countResult[0]?.total || 0;
      pipeline.push({ $skip: skip }, { $limit: pageSize });
      const result = await this.orderModel.aggregate(pipeline).exec();
      return {
        meta: buildMeta(current, pageSize, totalItems),
        result,
      };
    } catch (error) {
      this.logger.error('List order error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  async update(handler: Types.ObjectId, orderId: Types.ObjectId, updateOrderDto: UpdateOrderDto) {
    try {
      const updated = await this.orderModel.updateOne({ _id: orderId }, { status: updateOrderDto.status, updatedBy: handler })
      if (updated.matchedCount === 0) {
        throw new NotFoundException(`Order with id ${orderId} not found`);
      }
      return {
        matchedCount: updated.matchedCount,
        modifiedCount: updated.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Updated order error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async remove(orderId: Types.ObjectId) {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      // Tìm đơn hàng ở trạng thái có thể hủy
      const order = await this.orderModel
        .findOne({ _id: orderId, status: EStatus.PENDING })
        .session(session);

      if (!order) {
        throw new NotFoundException('Order not found or cannot be deleted');
      }

      const orderItems = await this.orderItemModel.find({ order: orderId }).session(session);
      const configOrderItems: any[] = orderItems.map((e) => {
        return {
          productId: e.product,
          quantity: e.quantity
        }
      })
      await this.productService.refundQuantityProduct(configOrderItems, session);

      await this.orderItemModel.deleteMany({ order: orderId }, { session });
      await this.paymentModel.deleteOne({ _id: order.payment }, { session });
      await this.orderModel.deleteOne({ _id: orderId }, { session });

      await session.commitTransaction();
      return "ok";
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Cancelled order error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    } finally {
      session.endSession();
    }
  }


  async updatePaymentStatus(orderCode: string, status: EPaymentStatus, description: string | null, rsqCode: string | null) {
    const order = await this.orderModel.findOne({ code: orderCode });
    if (!order) {
      return null;
    }
    return this.paymentModel.updateOne({ _id: order.payment }, { status, description, rsqCode })
  }
}

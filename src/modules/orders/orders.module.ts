import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderItem, OrderItemSchema } from './schemas/order-item.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { ProductsModule } from '@modules/products/products.module';
import { GhnModule } from '@modules/ghn/ghn.module';
import { CartsModule } from '@modules/carts/carts.module';
import { VnpayModule } from '@modules/vnpay/vnpay.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MongooseModule.forFeature([
      { name: OrderItem.name, schema: OrderItemSchema },
    ]),
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    ProductsModule,
    GhnModule,
    CartsModule,
    forwardRef(() => VnpayModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule { }

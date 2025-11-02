import { forwardRef, Module } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import { OrdersModule } from '@modules/orders/orders.module';

@Module({
  imports: [
    forwardRef(() => OrdersModule),
  ],
  controllers: [VnpayController],
  providers: [VnpayService],
  exports: [VnpayService]
})
export class VnpayModule { }

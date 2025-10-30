import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import type { IToken } from '@common/interfaces/customize.interface';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post("create-order")
  @ResponseMessage("Created successfully")
  create(
    @UserReq() user: IToken,
    @Body() createOrderDto: CreateOrderDto
  ) {
    return this.ordersService.create(user.sub, createOrderDto);
  }

  @Get("list order")
  findAll(

  ) {
    return this.ordersService.findAll();
  }

  @Get('list-order-of-user')
  findAllOfUser(
    @UserReq() user: IToken, @Query() query: any) {
    const { current, pageSize } = query;
    return this.ordersService.findAllOfUser(user.sub, +current, +pageSize);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}

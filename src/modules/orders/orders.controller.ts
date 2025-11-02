import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ResponseMessage, Roles, UserReq } from '@common/decorators/customize.decorator';
import type { IToken } from '@common/interfaces/customize.interface';
import { ERole } from '@common/types/type';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Request, Response } from 'express';
import { getClientIp } from '@common/helpers/helper';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post("create-order")
  @ResponseMessage("Created successfully")
  create(
    @UserReq() user: IToken,
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: Request,
  ) {
    const ipAddr = getClientIp(req)
    return this.ordersService.create(user.sub, ipAddr, createOrderDto);
  }

  @Get("list-order")
  @Roles(ERole.ADMIN, ERole.STAFF)
  findAll(@Query() query: any) {
    const { current, pageSize, ...filters } = query;
    return this.ordersService.findAll(+current, +pageSize, filters);
  }

  @Get('list-order-of-user')
  findAllOfUser(
    @UserReq() user: IToken, @Query() query: any) {
    const { current, pageSize, ...filters } = query;
    return this.ordersService.findAllOfUser(user.sub, +current, +pageSize, filters);
  }

  @Patch('update-status/:id')
  @Roles(ERole.ADMIN, ERole.STAFF)
  @ResponseMessage("Updated successfully")
  update(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(user.sub, id, updateOrderDto);
  }

  @Delete('cancel-order/:id')
  @ResponseMessage("Cancelled successfully")
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.ordersService.remove(id);
  }
}

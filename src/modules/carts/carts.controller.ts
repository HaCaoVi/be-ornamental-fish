import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import type { IToken } from '@common/interfaces/customize.interface';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) { }

  @Post("create-cart")
  @ResponseMessage("Added successfully")
  create(
    @UserReq() user: IToken,
    @Body() createCartDto: CreateCartDto) {
    return this.cartsService.create(user.sub, createCartDto);
  }

  @Get('count-cart')
  countCart(
    @UserReq() user: IToken
  ) {
    return this.cartsService.countCart(user.sub);
  }

  @Get("list-cart")
  findAll(
    @UserReq() user: IToken,
    @Query() query: any
  ) {
    const { current, pageSize } = query;
    return this.cartsService.findAll(user.sub, +current, +pageSize);
  }

  @Patch('update-quantity/:id')
  updateQuantity(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() updateCartDto: UpdateCartDto) {
    return this.cartsService.updateQuantity(id, updateCartDto);
  }

  @Get('view-cart/:id')
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(+id);
  }

  @Patch('update-cart/:id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartsService.update(+id, updateCartDto);
  }

  @Delete('delete-cart/:id')
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.cartsService.remove(id);
  }
}

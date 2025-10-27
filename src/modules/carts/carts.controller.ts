import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import type { IToken } from '@common/interfaces/customize.interface';

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
  findAll() {
    return this.cartsService.findAll();
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
  remove(@Param('id') id: string) {
    return this.cartsService.remove(+id);
  }
}

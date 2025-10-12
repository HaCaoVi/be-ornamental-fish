import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ResponseMessage, Roles, UserReq } from '@common/decorators/customize.decorator';
import type { IToken } from '@common/interfaces/customize.interface';
import { Types } from 'mongoose';
import { ERole } from '@common/types/type';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post("create-product")
  @Roles(ERole.ADMIN, ERole.STAFF)
  @ResponseMessage("Created new product")
  create(
    @UserReq() user: IToken,
    @Body() createFishDto: CreateProductDto
  ) {
    return this.productsService.create(user, createFishDto);
  }

  @Get("list-product")
  findAll(
    @Query() query: any
  ) {
    const { current, pageSize, ...filters } = query;
    return this.productsService.findAll(+current, +pageSize, filters);
  }

  @Get('get-product/:id')
  findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId
  ) {
    return this.productsService.findOne(id);
  }

  @Patch('update-product/:id')
  @ResponseMessage("Updated product")
  @Roles(ERole.ADMIN, ERole.STAFF)
  update(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateFishDto: UpdateProductDto) {
    return this.productsService.update(user, id, updateFishDto);
  }

  @Delete('delete-product/:id')
  @ResponseMessage("Deleted product")
  @Roles(ERole.ADMIN)
  removeProduct(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ) {
    return this.productsService.removeProduct(user, id);
  }
}

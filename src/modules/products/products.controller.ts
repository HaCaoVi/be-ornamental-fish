import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateFishDto } from './dto/create-product.dto';
import { UpdateFishDto } from './dto/update-product.dto';
import { ResponseMessage, Roles, UserReq } from '@common/decorators/customize.decorator';
import type { IToken } from '@common/interfaces/customize.interface';
import { Types } from 'mongoose';
import { ERole } from '@common/types/type';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post("create-fish")
  @Roles(ERole.ADMIN, ERole.STAFF)
  @ResponseMessage("Created new fish")
  create(
    @UserReq() user: IToken,
    @Body() createFishDto: CreateFishDto
  ) {
    return this.productsService.createFish(user, createFishDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: Types.ObjectId) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: Types.ObjectId, @Body() updateFishDto: UpdateFishDto) {
    return this.productsService.update(id, updateFishDto);
  }

  @Delete(':id')
  remove(@Param('id') id: Types.ObjectId) {
    return this.productsService.remove(id);
  }
}

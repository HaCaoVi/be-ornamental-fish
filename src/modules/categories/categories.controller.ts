import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDetailDto, CreateCategoryDto } from './dto/create-category.dto';
import { Public, ResponseMessage, UserReq } from '@common/decorators/customize.decorator';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import type { IToken } from '@common/interfaces/customize.interface';
import { Types } from 'mongoose';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post("create-category")
  @ResponseMessage("Created successfully")
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Public()
  @Get("list-category")
  @ResponseMessage("Get list category")
  findAllCategory() {
    return this.categoriesService.findAllCategory();
  }

  @Get('get-category/:id')
  @ResponseMessage("Get a category")
  findOneCategory(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.categoriesService.findOneCategory(id);
  }

  @Post("create-category-detail")
  @ResponseMessage("Created successfully")
  createCategoryDetail(
    @UserReq() user: IToken,
    @Body() createCategoryDetailDto: CreateCategoryDetailDto) {
    return this.categoriesService.createCategoryDetail(user, createCategoryDetailDto);
  }

  @Public()
  @Get("list-category-detail/:categoryId")
  @ResponseMessage("Get list category")
  findAllCategoryDetail(
    @Param('categoryId', ParseObjectIdPipe) categoryId: Types.ObjectId
  ) {
    return this.categoriesService.findAllCategoryDetail(categoryId);
  }

  @Patch("update-category-detail/:id")
  @ResponseMessage("Updated successfully")
  updateCategoryDetail(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() createCategoryDetailDto: CreateCategoryDetailDto
  ) {
    return this.categoriesService.updateCategoryDetail(user, id, createCategoryDetailDto);
  }

  @Delete("update-category-detail/:id")
  @ResponseMessage("Updated successfully")
  deleteCategoryDetail(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ) {
    return this.categoriesService.deleteCategoryDetail(user, id);
  }
}

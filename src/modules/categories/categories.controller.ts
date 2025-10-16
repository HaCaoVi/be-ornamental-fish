import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDetailDto, CreateCategoryDto } from './dto/create-category.dto';
import { Public, ResponseMessage, Roles, UserReq } from '@common/decorators/customize.decorator';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import type { IToken } from '@common/interfaces/customize.interface';
import { Types } from 'mongoose';
import { ERole } from '@common/types/type';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post("create-category")
  @Roles(ERole.ADMIN)
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
  @Roles(ERole.ADMIN, ERole.STAFF)
  @ResponseMessage("Created successfully")
  createCategoryDetail(
    @UserReq() user: IToken,
    @Body() createCategoryDetailDto: CreateCategoryDetailDto) {
    return this.categoriesService.createCategoryDetail(user, createCategoryDetailDto);
  }

  @Public()
  @Get("list-category-detail")
  @ResponseMessage("Get list category detail")
  findAllCategoryDetail(
    @Query() query: any
  ) {
    const { current, pageSize, ...filters } = query;
    return this.categoriesService.findAllCategoryDetail(+current, +pageSize, filters);
  }

  @Patch("update-category-detail/:id")
  @Roles(ERole.ADMIN)
  @ResponseMessage("Updated successfully")
  updateCategoryDetail(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() createCategoryDetailDto: CreateCategoryDetailDto
  ) {
    return this.categoriesService.updateCategoryDetail(user, id, createCategoryDetailDto);
  }

  @Delete("delete-category-detail/:id")
  @Roles(ERole.ADMIN)
  @ResponseMessage("Deleted successfully")
  deleteCategoryDetail(
    @UserReq() user: IToken,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ) {
    return this.categoriesService.deleteCategoryDetail(user, id);
  }

  @Public()
  @Get("list-all-follow-category")
  @ResponseMessage("Get list category detail")
  findAllFollowCategory() {
    return this.categoriesService.findAllFollowCategory();
  }

}

import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Public, ResponseMessage } from '@common/decorators/customize.decorator';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post("create-category")
  @ResponseMessage("Created successfully")
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Public()
  @Get("list-category")
  @ResponseMessage("Get list category")
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('get-category/:id')
  @ResponseMessage("Get a category")
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.categoriesService.findOne(id);
  }
}

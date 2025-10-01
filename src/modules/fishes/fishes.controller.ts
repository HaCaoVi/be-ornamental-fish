import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FishesService } from './fishes.service';
import { CreateFishDto } from './dto/create-fish.dto';
import { UpdateFishDto } from './dto/update-fish.dto';

@Controller('fishes')
export class FishesController {
  constructor(private readonly fishesService: FishesService) {}

  @Post()
  create(@Body() createFishDto: CreateFishDto) {
    return this.fishesService.create(createFishDto);
  }

  @Get()
  findAll() {
    return this.fishesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fishesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFishDto: UpdateFishDto) {
    return this.fishesService.update(+id, updateFishDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fishesService.remove(+id);
  }
}

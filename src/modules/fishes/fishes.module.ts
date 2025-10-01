import { Module } from '@nestjs/common';
import { FishesService } from './fishes.service';
import { FishesController } from './fishes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Fish, FishSchema } from './schemas/fish.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Fish.name, schema: FishSchema }]),
  ],
  controllers: [FishesController],
  providers: [FishesService],
})
export class FishesModule { }

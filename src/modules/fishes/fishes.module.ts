import { Module } from '@nestjs/common';
import { FishesService } from './fishes.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Fish, FishSchema } from './schemas/fish.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Fish.name, schema: FishSchema }]),
  ],
  providers: [FishesService],
  exports: [FishesService]
})
export class FishesModule { }

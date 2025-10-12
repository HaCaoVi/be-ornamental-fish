import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Food } from './schemas/food.schema';
import { ClientSession, Model, Types } from 'mongoose';

@Injectable()
export class FoodsService {
  constructor(
    @InjectModel(Food.name) private fishModel: Model<Food>,
  ) { }

  async create(productId: Types.ObjectId, weight: string, pelletSize: string, session: ClientSession) {
    const [fish] = await this.fishModel.create(
      [{ product: productId, weight, pelletSize }],
      { session }
    );
    return fish;
  }

  async update(productId: Types.ObjectId, weight?: string, session?: ClientSession) {
    return this.fishModel.updateOne({ product: productId }, { weight }, { runValidators: true, session })
  }
}

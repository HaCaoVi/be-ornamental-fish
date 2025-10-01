import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Fish } from './schemas/fish.schema';
import { ClientSession, Model, Types } from 'mongoose';

@Injectable()
export class FishesService {
  constructor(
    @InjectModel(Fish.name) private fishModel: Model<Fish>,
  ) { }

  async create(productId: Types.ObjectId, color: string, size: string, origin: string, session: ClientSession) {
    const [fish] = await this.fishModel.create(
      [{ product: productId, color, size, origin }],
      { session }
    );
    return fish;
  }

  findAll() {
    return `This action returns all fishes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fish`;
  }

  update(id: number) {
    return `This action updates a #${id} fish`;
  }

  remove(id: number) {
    return `This action removes a #${id} fish`;
  }
}

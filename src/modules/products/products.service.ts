import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateFishDto } from './dto/create-product.dto';
import { UpdateFishDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product, type ProductModelType } from './schemas/product.schema';
import type { IToken } from '@common/interfaces/customize.interface';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: ProductModelType,
  ) { }

  async createFish(author: IToken, createFishDto: CreateFishDto) {
    try {
      const { color, size, ...rest } = createFishDto
      const newFish = await this.productModel.create({
        ...rest,
        createdBy: author.sub
      })

      return {
        id: newFish._id,
        createdAt: newFish.createdAt
      };
    } catch (error) {
      this.logger.error("Created fish error: " + error.message, error.stack);
      if (error?.code === 11000) {
        throw new BadRequestException("Code already exists!");
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateFishDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}

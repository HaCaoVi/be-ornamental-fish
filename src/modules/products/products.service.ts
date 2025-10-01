import { BadRequestException, forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateFishDto } from './dto/create-product.dto';
import { UpdateFishDto } from './dto/update-product.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Product, type ProductModelType } from './schemas/product.schema';
import type { IToken } from '@common/interfaces/customize.interface';
import { Connection, Model, Types } from 'mongoose';
import { Stock } from './schemas/stock.schema';
import { Gallery } from './schemas/gallery.schema';
import { FishesService } from '@modules/fishes/fishes.service';
import { CategoriesService } from '@modules/categories/categories.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Product.name) private productModel: ProductModelType,
    @InjectModel(Product.name) private galleryModel: Model<Gallery>,
    @InjectModel(Product.name) private stockModel: Model<Stock>,
    @Inject(forwardRef(() => CategoriesService)) private categoryService: CategoriesService,
    private fishService: FishesService,
  ) { }

  async countProductHasCategoryDetailId(categoryDetailId: Types.ObjectId) {
    return this.productModel.countDocumentsSoftDelete({ categoryDetail: categoryDetailId });
  }

  async createFish(author: IToken, createFishDto: CreateFishDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const { color, size, origin, gallery, quantity, categoryDetail, ...rest } = createFishDto;
      const categoryDetailExist = await this.categoryService.isCategoryDetailExist(categoryDetail, session);
      if (!categoryDetailExist) {
        throw new NotFoundException(`Category detail with id ${categoryDetail} not found!`);
      }
      const [newFish] = await this.productModel.create(
        [{ ...rest, categoryDetail, createdBy: author.sub }],
        { session }
      );

      await this.fishService.create(newFish._id, color, size, origin, session);

      await this.stockModel.create(
        [{ product: newFish._id, quantity }],
        { session }
      );

      if (gallery && gallery.length > 0) {
        await this.galleryModel.insertMany(
          gallery.map(img => ({ imageUrl: img, product: newFish._id })),
          { session }
        );
      }
      await session.commitTransaction();
      return { id: newFish._id, createdAt: newFish.createdAt };
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch { }
      this.logger.error("Created fish error: " + error.message, error.stack);
      if (error?.code === 11000) throw new BadRequestException("Code already exists!");
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Something went wrong!");
    } finally {
      session.endSession();
    }
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: Types.ObjectId) {
    return `This action returns a #${id} product`;
  }

  update(id: Types.ObjectId, updateProductDto: UpdateFishDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: Types.ObjectId) {
    return `This action removes a #${id} product`;
  }
}

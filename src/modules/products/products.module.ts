import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { Gallery, GallerySchema } from './schemas/gallery.schema';
import { Stock, StockSchema } from './schemas/stock.schema';
import { FishesModule } from '@modules/fishes/fishes.module';
import { CategoriesModule } from '@modules/categories/categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Gallery.name, schema: GallerySchema }]),
    MongooseModule.forFeature([{ name: Stock.name, schema: StockSchema }]),
    FishesModule,
    CategoriesModule
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule { }

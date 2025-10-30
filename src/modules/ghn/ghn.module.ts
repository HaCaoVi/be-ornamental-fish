import { Module } from '@nestjs/common';
import { GhnService } from './ghn.service';
import { GhnController } from './ghn.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '@modules/products/schemas/product.schema';
import { ProductsModule } from '@modules/products/products.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT'),
        maxRedirects: configService.get<number>('HTTP_MAX_REDIRECTS'),
        baseURL: configService.get<string>("GHN_DOMAIN_URL"),
        headers: {
          "Content-Type": "application/json",
          "token": configService.get<string>("GHN_TOKEN"),
          "shop_id": configService.get<string>("GHN_SHOP_ID"),
        }
      }),
      inject: [ConfigService],
    }),
    ProductsModule
  ],
  controllers: [GhnController],
  providers: [GhnService],
  exports: [GhnService]
})
export class GhnModule { }

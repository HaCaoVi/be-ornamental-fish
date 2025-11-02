import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesModule } from '@modules/roles/roles.module';
import { UsersModule } from '@modules/users/users.module';
import { AuthModule } from '@modules/auth/auth.module';
import { FilesModule } from '@modules/files/files.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { ProductsModule } from '@modules/products/products.module';
import { MailModule } from '@modules/mail/mail.module';
import { CartsModule } from '@modules/carts/carts.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { GhnModule } from '@modules/ghn/ghn.module';
import { VnpayModule } from '@modules/vnpay/vnpay.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('DB_MONGO_URL'),
      }),
      inject: [ConfigService],
    }),
    RolesModule,
    UsersModule,
    AuthModule,
    FilesModule,
    CategoriesModule,
    ProductsModule,
    MailModule,
    CartsModule,
    OrdersModule,
    GhnModule,
    VnpayModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

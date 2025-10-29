import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ProductOrder, ShippingFeeGhnDto } from './dto/create-ghn.dto';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import type { ResponseGHN } from '@common/interfaces/customize.interface';
import { ConfigService } from '@nestjs/config';
import { Product, type ProductModelType } from '@modules/products/schemas/product.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class GhnService {
  private readonly logger = new Logger(GhnService.name);
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    @InjectModel(Product.name) private productModel: ProductModelType,
  ) { }

  async calculateProductList(listProductOrder: ProductOrder[]) {
    try {
      const productIds = listProductOrder.map((item) => item.productId);

      const productList = await this.productModel
        .find({ _id: { $in: productIds } })
        .select('price discount height length width weight')
        .lean<Product[]>()
        .exec();

      if (productList.length === 0) {
        return {
          height: 0,
          length: 0,
          width: 0,
          weight: 0,
          total: 0,
        };
      }

      const quantityMap = new Map(
        listProductOrder.map((item) => [item.productId, item.quantity]),
      );

      const summary = productList.reduce(
        (acc, p) => {
          const quantity = quantityMap.get(String(p._id)) || 1;
          const discount = Math.min(Math.max(p.discount || 0, 0), 100);
          const priceAfterDiscount = p.price - (p.price * discount) / 100;

          return {
            height: acc.height + Math.max(p.height, 0) * quantity,
            length: acc.length + Math.max(p.length, 0) * quantity,
            width: acc.width + Math.max(p.width, 0) * quantity,
            weight: acc.weight + Math.max(p.weight, 0) * quantity,
            total: acc.total + priceAfterDiscount * quantity,
          };
        },
        { height: 0, length: 0, width: 0, weight: 0, total: 0 },
      );
      return summary
    } catch (error) {
      console.error('Error calculating product list:', error);
      return {
        height: 0,
        length: 0,
        width: 0,
        weight: 0,
        total: 0,
      };
    }
  }

  async shippingFee(shippingFeeGhnDto: ShippingFeeGhnDto) {
    const { toWardCode, toDistrictId, listProductOrder } = shippingFeeGhnDto;

    const { height, length, total, width, weight } = await this.calculateProductList(listProductOrder)

    const { data } = await firstValueFrom(
      this.httpService.post<ResponseGHN<any>>('/v2/shipping-order/fee', {
        from_district_id: Number(this.configService.get('SHOP_DISTRICT_ID')),
        from_ward_code: this.configService.get<string>('SHOP_WARD_CODE'),
        service_type_id: Number(this.configService.get('GHN_SERVICE_TYPE_ID')),
        cod_failed_amount: Number(this.configService.get('COD_FAILED_AMOUNT')),
        coupon: null,
        to_district_id: toDistrictId,
        to_ward_code: toWardCode,
        height: height,
        length: length,
        width: width,
        weight: weight,
        insurance_value: total
      }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.message);
          throw new BadRequestException('Failed to fetch fee from GHN!');
        }),
      ),
    );
    if (data.code !== 200) {
      throw new BadRequestException(data.message || 'GHN API returned an error');
    }
    return data.data;
  }


  async findAllProvince() {
    const { data } = await firstValueFrom(
      this.httpService.get<ResponseGHN<any>>('/master-data/province').pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error);
          throw 'Failed to fetch province from GHN!';
        }),
      ),
    );
    if (data.code !== 200) {
      throw new BadRequestException(data.message || 'GHN API returned an error');
    }
    return data.data;
  }

  async findAllDistrict(province_id: number) {
    const { data } = await firstValueFrom(
      this.httpService.get<ResponseGHN<any>>('/master-data/district', {
        data: {
          province_id
        }
      }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response?.data || error.message);
          console.error('GHN API error:', error.response?.data || error.message);
          throw 'Failed to fetch district from GHN!';
        }),
      ),
    );
    if (data.code !== 200) {
      throw new BadRequestException(data.message || 'GHN API returned an error');
    }
    return data.data;
  }

  async findAllWard(district_id: number) {
    const { data } = await firstValueFrom(
      this.httpService.get<ResponseGHN<any>>(`/master-data/ward?district_id=${district_id}`
      ).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response?.data || error.message);
          console.error('GHN API error:', error.response?.data || error.message);
          throw 'Failed to fetch ward from GHN!';
        }),
      ),
    );
    if (data.code !== 200) {
      throw new BadRequestException(data.message || 'GHN API returned an error');
    }
    return data.data;
  }

}

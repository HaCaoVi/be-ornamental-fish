import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ProductOrder, ShippingFeeGhnDto } from './dto/create-ghn.dto';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import type { ResponseGHN } from '@common/interfaces/customize.interface';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '@modules/products/products.service';

@Injectable()
export class GhnService {
  private readonly logger = new Logger(GhnService.name);
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private productService: ProductsService,
  ) { }

  async shippingFee(shippingFeeGhnDto: ShippingFeeGhnDto) {
    const { toWardCode, toDistrictId, listProductOrder } = shippingFeeGhnDto;

    const { height, length, total, width, weight } = await this.productService.calculateProductList(listProductOrder)
    console.log("height, length, total, width, weight>>>>>", height, length, total, width, weight);

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
    return { ...data.data, totalAmount: total };
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

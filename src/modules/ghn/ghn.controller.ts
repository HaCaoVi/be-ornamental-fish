import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GhnService } from './ghn.service';
import { ShippingFeeGhnDto } from './dto/create-ghn.dto';

@Controller('ghn')
export class GhnController {
  constructor(private readonly ghnService: GhnService) { }

  @Post("shipping-fee")
  shippingFee(@Body() shippingFeeGhnDto: ShippingFeeGhnDto) {
    return this.ghnService.shippingFee(shippingFeeGhnDto);
  }

  @Get("list-province")
  findAllProvince() {
    return this.ghnService.findAllProvince();
  }

  @Get("list-district/:province_id")
  findAllDistrict(
    @Param("province_id") province_id: number
  ) {
    return this.ghnService.findAllDistrict(province_id);
  }

  @Get("list-ward/:district_id")
  findAllWard(
    @Param("district_id") district_id: number
  ) {
    return this.ghnService.findAllWard(district_id);
  }
}

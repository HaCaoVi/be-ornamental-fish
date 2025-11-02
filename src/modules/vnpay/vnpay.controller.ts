import {
    Controller,
    Get,
    Query,
    Req,
    Res,
} from '@nestjs/common';
import {
    Public,
} from '@common/decorators/customize.decorator';
import { VnpayService } from './vnpay.service';
import type { query, Request, Response } from 'express';

@Controller('vnpay')
export class VnpayController {
    constructor(private readonly vnpayService: VnpayService) { }

    @Public()
    @Get('vnpay_return')
    vnPayReturn(
        @Res() res: Response,
        @Query() query: any,
    ) {
        return this.vnpayService.vnPayReturn(res, query);
    }

    @Public()
    @Get('vnpay_ipn')
    vnPayIpn(
        @Res() res: Response,
        @Query() query: any,
    ) {
        return this.vnpayService.vnPayIpn(res, query);
    }
}

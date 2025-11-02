import { forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import querystring from "qs"
import * as crypto from 'crypto';
import type { Response } from 'express';
import { OrdersService } from '@modules/orders/orders.service';
import { EPaymentStatus } from '@common/types/type';

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => OrdersService))
    private orderService: OrdersService
  ) { }

  sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj)
      .filter((key) => obj.hasOwnProperty(key))
      .sort();
    for (const key of keys) {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }
    return sorted;
  }

  createLinkPaymentVNPay(orderCode: string, totalFinal: number, ipAddr: string): string {
    try {
      const date = new Date();
      const createDate = dayjs(date).format('YYYYMMDDHHmmss');
      const expireDate = dayjs(date).add(10, 'minute').format('YYYYMMDDHHmmss');
      let vnp_Params = {};
      vnp_Params['vnp_Version'] = '2.1.0';
      vnp_Params['vnp_Command'] = 'pay';
      vnp_Params['vnp_TmnCode'] = this.configService.get<string>("VNP_TMN_CODE");
      vnp_Params['vnp_Amount'] = totalFinal * 100;
      vnp_Params['vnp_CreateDate'] = createDate;
      vnp_Params['vnp_CurrCode'] = "VND";
      vnp_Params['vnp_IpAddr'] = ipAddr;
      vnp_Params['vnp_Locale'] = "vn";
      vnp_Params['vnp_OrderInfo'] = 'Pay for transaction code: ' + orderCode;
      vnp_Params['vnp_OrderType'] = 'other';
      vnp_Params['vnp_ReturnUrl'] = this.configService.get<string>("VNP_RETURN_URL");
      vnp_Params['vnp_ExpireDate'] = expireDate;
      vnp_Params['vnp_TxnRef'] = orderCode;

      vnp_Params = this.sortObject(vnp_Params);
      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", this.configService.get<string>("VNP_HASH_SECRET") + "");
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
      vnp_Params['vnp_SecureHash'] = signed;
      return `${this.configService.get<string>("VNP_URL")}?${querystring.stringify(vnp_Params, { encode: false })}`
    } catch (error) {
      this.logger.error('Created vnpay url error: ' + error.message, error.stack);
      return ""
    }
  }

  async vnPayReturn(res: Response, query: any) {
    try {
      let vnp_Params = { ...query };
      let secureHash = vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];
      vnp_Params = this.sortObject(vnp_Params);
      let signData = querystring.stringify(vnp_Params, { encode: false });
      let hmac = crypto.createHmac("sha512", this.configService.get<string>("VNP_HASH_SECRET") + "");
      let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
      const {
        vnp_TxnRef,
        vnp_Amount,
        vnp_ResponseCode,
        vnp_TransactionStatus,
        vnp_PayDate,
        vnp_TransactionNo,
      } = vnp_Params;

      // tạo query string FE-friendly
      const queryString = new URLSearchParams({
        vnp_TxnRef,
        vnp_Amount,
        vnp_ResponseCode,
        vnp_TransactionStatus,
        vnp_PayDate,
        vnp_TransactionNo,
      }).toString();
      if (secureHash === signed) {
        if (this.configService.get<string>("NODE_ENV") !== "production") {
          await this.orderService.updatePaymentStatus(vnp_TxnRef, EPaymentStatus.PAID, this.getVnPayResponseDescription(vnp_ResponseCode), vnp_ResponseCode)
        }
        return res.redirect(
          `${this.configService.get<string>("FE_ORIGIN_URL")}/payment/payment-result?${queryString}`
        );
      } else {
        return res.redirect(
          `${this.configService.get<string>("FE_ORIGIN_URL")}/payment/payment-result?${queryString}&error=${this.getVnPayResponseDescription(vnp_ResponseCode)}`
        );
      }
    } catch (error) {
      this.logger.error('VnPay return error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  getVnPayResponseDescription(code: string): string {
    const map: Record<string, string> = {
      "00": "Transaction successful",
      "07": "Money was deducted successfully, but the transaction is under suspicion (fraud or unusual activity).",
      "09": "Transaction failed: The card/account is not registered for Internet Banking at the bank.",
      "10": "Transaction failed: Incorrect card/account information entered more than 3 times.",
      "11": "Transaction failed: Payment timeout. Please try again.",
      "12": "Transaction failed: The card/account has been locked.",
      "13": "Transaction failed: Wrong OTP (one-time password). Please try again.",
      "24": "Transaction failed: The customer cancelled the transaction.",
      "51": "Transaction failed: Insufficient account balance.",
      "65": "Transaction failed: The account has exceeded the daily transaction limit.",
      "75": "Transaction failed: The payment bank is under maintenance.",
      "79": "Transaction failed: Too many incorrect payment password attempts. Please try again.",
      "99": "Transaction failed: Unknown error or unspecified issue.",
    };

    return map[code] || "Unknown response code";
  }


  async vnPayIpn(res: Response, query: any) {
    try {
      let vnp_Params = { ...query };
      let secureHash = vnp_Params['vnp_SecureHash'];
      let orderCode = vnp_Params['vnp_TxnRef'].trim();;
      let rspCode = vnp_Params['vnp_ResponseCode'];
      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];
      vnp_Params = this.sortObject(vnp_Params);
      let signData = querystring.stringify(vnp_Params, { encode: false });
      let hmac = crypto.createHmac("sha512", this.configService.get<string>("VNP_HASH_SECRET") + "");
      let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
      if (secureHash === signed) {
        if (rspCode === "00") {
          const order = await this.orderService.updatePaymentStatus(orderCode, EPaymentStatus.PAID, this.getVnPayResponseDescription(rspCode), rspCode)
          if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
          }
          return res.status(200).json({ RspCode: rspCode, Message: this.getVnPayResponseDescription(rspCode) })
        } else {
          await this.orderService.updatePaymentStatus(orderCode, EPaymentStatus.UNPAID, this.getVnPayResponseDescription(rspCode), rspCode)
          return res.status(200).json({ RspCode: rspCode, Message: this.getVnPayResponseDescription(rspCode) })
        }
      }
      else {
        this.logger.warn(`VNPay checksum failed for order ${orderCode}`, vnp_Params);
        return res.status(200).json({ RspCode: "97", Message: "Checksum failed" })
      }
    } catch (error) {
      this.logger.error('VnPay ipn error: ' + error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Something went wrong!');
    }
  }
}

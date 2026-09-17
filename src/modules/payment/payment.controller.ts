import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentResolvedVia } from './schemas/payment.schema';

@ApiTags('Payment')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @Post('initiate')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Create a pending order and return PayU Bolt checkout params',
  })
  async initiate(@Req() req: any, @Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiate(dto, {
      userId: req.user?.userId,
      email: req.user?.email,
    });
  }

  // PayU posts the transaction result here (surl + furl). Primarily a
  // server-to-server call; if a browser lands here (non-Bolt fallback) we bounce
  // it to the frontend status page with a 302 so no inline script is needed.
  @Post('payu/callback')
  @ApiExcludeEndpoint()
  async payuCallback(
    @Req() req: any,
    @Body() payload: Record<string, any>,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.processPayuResult(
      payload,
      PaymentResolvedVia.CALLBACK,
    );

    const base = this.configService.get<string>('payu.frontendUrl') || '';
    const txnid = payload?.txnid || result.orderId || '';
    const wantsHtml = String(req.headers?.accept || '').includes('text/html');

    if (base && wantsHtml) {
      return res.redirect(
        302,
        `${base}/checkout/status?txnid=${encodeURIComponent(txnid)}`,
      );
    }
    return res.status(200).json({ received: true, ...result });
  }

  @Post('payu/webhook')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async payuWebhook(@Body() payload: Record<string, any>) {
    return this.paymentService.processPayuResult(payload, PaymentResolvedVia.WEBHOOK);
  }

  @Get('status/:txnid')
  @ApiOperation({ summary: 'Get the status of a PayU transaction' })
  async getStatus(@Param('txnid') txnid: string) {
    return this.paymentService.getStatus(txnid);
  }

  // Public receipt lookup keyed by the (random) txnid — lets a guest print their
  // order after paying without an account.
  @Get(':txnid/receipt')
  @ApiOperation({ summary: 'Get the full order + payment details for a transaction' })
  async getReceipt(@Param('txnid') txnid: string) {
    return this.paymentService.getReceipt(txnid);
  }
}

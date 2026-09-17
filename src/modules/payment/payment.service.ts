import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CartService } from '../cart/cart.service';
import { GuestService } from '../guest/guest.service';
import { OrderService } from '../order/order.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import {
  Payment,
  PaymentResolvedVia,
  PaymentStatus,
} from './schemas/payment.schema';
import {
  buildRequestHash,
  buildResponseHash,
  buildVerifyHash,
  timingSafeEqualHex,
} from './payu.hash';

interface Caller {
  userId?: string;
  email?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private configService: ConfigService,
    private orderService: OrderService,
    private cartService: CartService,
    private guestService: GuestService,
  ) {}

  private cfg<T = string>(k: string): T {
    return this.configService.get<T>(`payu.${k}`) as T;
  }

  // Build the params + hash the browser hands to bolt.launch().
  async initiate(dto: InitiatePaymentDto, caller: Caller) {
    const key = this.cfg('merchantKey');
    const salt = this.cfg('merchantSalt');
    const callbackUrl = this.cfg('callbackUrl');
    if (!key || !salt || !callbackUrl) {
      throw new BadRequestException('Payment gateway is not configured');
    }

    const guestId = dto.guestId?.trim() || undefined;
    const userId = caller.userId;

    if (!userId && !guestId) {
      throw new BadRequestException('Sign in or start a guest session to pay');
    }

    // Always link the order to the signed-in account when there is one (so it shows
    // in their order history), but take the items from whichever cart has them —
    // the guest cart is the fallback for items added before login / not yet merged.
    let cart = userId ? await this.cartService.getCart(userId) : null;
    if (!cart?.items?.length && guestId) {
      cart = await this.guestService.getCart(guestId);
    }

    this.logger.debug(
      `initiate: user=${userId ?? '-'} guest=${guestId ?? '-'} items=${cart?.items?.length ?? 0}`,
    );

    if (!cart?.items?.length) {
      throw new BadRequestException(
        `Cart is empty for ${userId ? `user ${userId}` : `guest ${guestId}`}`,
      );
    }

    const name = (dto.customerDetails?.name || '').trim();
    const email = (dto.customerDetails?.email || caller.email || '').trim();
    const phone = (dto.customerDetails?.phone || '').trim();
    if (!name || !email || !phone) {
      throw new BadRequestException('Customer name, email and phone are required');
    }

    const shippingAddress = [
      dto.shippingAddress.address,
      dto.shippingAddress.city,
      dto.shippingAddress.state,
      dto.shippingAddress.pincode,
    ]
      .filter(Boolean)
      .join(', ');

    const order = await this.orderService.createPendingPayuOrder({
      userId,
      guestId,
      customerName: name,
      cart,
      contactEmail: email,
      contactPhone: phone,
      shippingAddress,
      notes: dto.notes,
    });

    if (!order.totalAmount || order.totalAmount <= 0) {
      throw new BadRequestException('Order amount must be greater than zero');
    }

    const txnid = this.generateTxnId();
    const amount = order.totalAmount.toFixed(2);
    const productinfo = `Order ${order.orderId}`;
    const firstname = name.replace(/[^A-Za-z ]/g, '').trim() || 'Customer';

    await this.paymentModel.create({
      txnid,
      orderId: order.orderId,
      orderRef: new Types.ObjectId(String(order._id)),
      userId,
      guestId,
      amount: order.totalAmount,
      productinfo,
      firstname,
      email,
      phone,
      status: PaymentStatus.INITIATED,
    });

    const hash = buildRequestHash(
      { key, txnid, amount, productinfo, firstname, email, udf1: order.orderId },
      salt,
    );

    return {
      boltScriptUrl: this.cfg('boltScriptUrl'),
      orderId: order.orderId,
      txnid,
      params: {
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl: callbackUrl,
        furl: callbackUrl,
        hash,
        udf1: order.orderId,
      },
    };
  }

  // Single entry point for every PayU result channel (surl/furl callback and
  // dashboard webhook). Verifies the reverse hash; if that can't be trusted it
  // falls back to the authoritative verify_payment API before resolving anything.
  async processPayuResult(
    payload: Record<string, any>,
    via: PaymentResolvedVia,
  ): Promise<{ ok: boolean; orderId?: string; status?: string }> {
    const txnid = payload?.txnid;
    if (!txnid) return { ok: false };

    const payment = await this.paymentModel.findOne({ txnid });
    if (!payment) {
      this.logger.warn(`PayU ${via}: no payment for txnid ${txnid}`);
      return { ok: false };
    }

    const key = this.cfg('merchantKey');
    const salt = this.cfg('merchantSalt');
    const hashOk =
      !!payload.hash &&
      timingSafeEqualHex(
        buildResponseHash(payload, key, salt).toLowerCase(),
        String(payload.hash).toLowerCase(),
      );

    let status = payload.status;
    let trusted = payload;

    if (!hashOk) {
      this.logger.warn(`PayU ${via}: reverse hash mismatch for ${txnid}, verifying with PayU`);
      const verified = await this.verifyWithPayu(txnid);
      if (!verified || verified.status === 'unknown') {
        this.logger.error(`PayU ${via}: could not verify ${txnid}, ignoring`);
        return { ok: false };
      }
      status = verified.status;
      trusted = {
        ...payload,
        status: verified.status,
        amount: verified.amt ?? verified.amount ?? payload.amount,
        mihpayid: verified.mihpayid,
        mode: verified.mode,
        bank_ref_num: verified.bank_ref_num,
      };
    }

    await this.resolvePayment(payment, status, trusted, via);
    return { ok: true, orderId: payment.orderId, status: payment.status };
  }

  // Frontend polls this after bolt's responseHandler fires. Reconciles against
  // PayU if we haven't already heard a definitive result.
  async getStatus(txnid: string) {
    const payment = await this.paymentModel.findOne({ txnid });
    if (!payment) throw new NotFoundException('Transaction not found');

    if (
      payment.status === PaymentStatus.INITIATED ||
      payment.status === PaymentStatus.PENDING
    ) {
      const verified = await this.verifyWithPayu(txnid);
      if (verified && verified.status !== 'unknown') {
        await this.resolvePayment(
          payment,
          verified.status,
          {
            status: verified.status,
            amount: verified.amt ?? verified.amount,
            mihpayid: verified.mihpayid,
            mode: verified.mode,
            bank_ref_num: verified.bank_ref_num,
          },
          PaymentResolvedVia.VERIFY_API,
        );
      }
    }

    return {
      txnid,
      status: payment.status,
      orderId: payment.orderId,
    };
  }

  async getReceipt(txnid: string) {
    const payment = await this.paymentModel.findOne({ txnid });
    if (!payment) throw new NotFoundException('Transaction not found');

    const order = await this.orderService.findByOrderId(payment.orderId);

    return {
      txnid: payment.txnid,
      paymentStatus: payment.status,
      paymentMode: payment.payuMode,
      bankRefNum: payment.bankRefNum,
      mihpayid: payment.payuMihpayid,
      paidAt: payment.status === PaymentStatus.SUCCESS ? payment.updatedAt : undefined,
      order,
    };
  }

  // Idempotent. `status` is assumed already trusted by the caller.
  private async resolvePayment(
    payment: Payment,
    rawStatus: string,
    payload: Record<string, any>,
    via: PaymentResolvedVia,
  ): Promise<void> {
    if (payment.status === PaymentStatus.SUCCESS) return;

    const status = String(rawStatus || '').toLowerCase();
    payment.payuResponse = payload;
    payment.payuMihpayid = payload.mihpayid || payment.payuMihpayid;
    payment.payuMode = payload.mode || payment.payuMode;
    payment.bankRefNum = payload.bank_ref_num || payment.bankRefNum;

    if (status === 'success') {
      const paidAmount = parseFloat(payload.amount);
      if (!Number.isNaN(paidAmount) && Math.abs(paidAmount - payment.amount) > 0.01) {
        this.logger.error(
          `PayU amount mismatch for ${payment.txnid}: expected ${payment.amount}, got ${payload.amount}`,
        );
        payment.status = PaymentStatus.FAILURE;
        payment.errorMessage = 'amount_mismatch';
        payment.resolvedVia = via;
        await payment.save();
        await this.orderService.markPayuOrderFailed(payment.orderId, payment.txnid);
        return;
      }

      payment.status = PaymentStatus.SUCCESS;
      payment.resolvedVia = via;
      await payment.save();
      await this.orderService.markPayuOrderPaid(payment.orderId, payment.txnid);
      await this.clearCallerCart(payment);
      return;
    }

    if (status === 'pending') {
      payment.status = PaymentStatus.PENDING;
      payment.resolvedVia = via;
      await payment.save();
      return;
    }

    payment.status = status.includes('cancel')
      ? PaymentStatus.CANCELLED
      : PaymentStatus.FAILURE;
    payment.errorCode = payload.error || payload.Error || payment.errorCode;
    payment.errorMessage =
      payload.error_Message || payload.field9 || payload.message || payment.errorMessage;
    payment.resolvedVia = via;
    await payment.save();
    await this.orderService.markPayuOrderFailed(payment.orderId, payment.txnid);
  }

  private async clearCallerCart(payment: Payment): Promise<void> {
    const tasks: Promise<any>[] = [];
    if (payment.userId) tasks.push(this.cartService.clearCart(payment.userId));
    if (payment.guestId) tasks.push(this.guestService.clearCart(payment.guestId));

    for (const result of await Promise.allSettled(tasks)) {
      if (result.status === 'rejected') {
        this.logger.warn(
          `Failed to clear a cart after payment ${payment.txnid}: ${result.reason?.message}`,
        );
      }
    }
  }

  // Server-to-server reconciliation against PayU's own record of the transaction.
  private async verifyWithPayu(txnid: string): Promise<Record<string, any> | null> {
    const key = this.cfg('merchantKey');
    const salt = this.cfg('merchantSalt');
    const command = 'verify_payment';
    const body = new URLSearchParams({
      key,
      command,
      var1: txnid,
      hash: buildVerifyHash(key, command, txnid, salt),
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${this.cfg('verifyBaseUrl')}/merchant/postservice?form=2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      });
      const json = await res.json();
      const details = json?.transaction_details?.[txnid];
      if (!details || typeof details !== 'object') return null;
      return { ...details, status: this.normalizePayuStatus(details.status) };
    } catch (error) {
      this.logger.error(`verify_payment failed for ${txnid}: ${error.message}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizePayuStatus(raw: any): string {
    const s = String(raw || '').toLowerCase();
    if (s.includes('success') || s === 'captured') return 'success';
    if (s.includes('pending') || s.includes('progress') || s.includes('initiated')) return 'pending';
    if (s.includes('cancel')) return 'cancelled';
    if (s.includes('fail') || s.includes('bounce') || s.includes('drop') || s.includes('refund')) {
      return 'failure';
    }
    return 'unknown';
  }

  // Alphanumeric, <= 25 chars (PayU limit).
  private generateTxnId(): string {
    return `T${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 25);
  }
}

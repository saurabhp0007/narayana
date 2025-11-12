import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const emailConfig = {
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Email service connection error:', error);
      } else {
        this.logger.log('Email service is ready');
      }
    });
  }

  async sendOrderConfirmation(
    to: string,
    orderData: {
      orderId: string;
      items: any[];
      totalAmount: number;
      subtotal: number;
      discount: number;
    },
  ): Promise<void> {
    try {
      const html = this.generateOrderConfirmationTemplate(orderData);

      await this.transporter.sendMail({
        from: this.configService.get<string>('email.from'),
        to,
        subject: `Order Confirmation - ${orderData.orderId}`,
        html,
      });

      this.logger.log(`Order confirmation email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email: ${error.message}`);
      // Don't throw error - email failure shouldn't break order creation
    }
  }

  async sendOrderStatusUpdate(
    to: string,
    orderData: {
      orderId: string;
      status: string;
      totalAmount: number;
    },
  ): Promise<void> {
    try {
      const html = this.generateStatusUpdateTemplate(orderData);

      await this.transporter.sendMail({
        from: this.configService.get<string>('email.from'),
        to,
        subject: `Order ${orderData.status.toUpperCase()} - ${orderData.orderId}`,
        html,
      });

      this.logger.log(`Order status update email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send status update email: ${error.message}`);
    }
  }

  private generateOrderConfirmationTemplate(orderData: any): string {
    const itemsHtml = orderData.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.productName} (${item.sku})
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ₹${item.price.toFixed(2)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ₹${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h1 style="color: #28a745; margin: 0;">Order Confirmed!</h1>
        </div>

        <p>Thank you for your order. We've received your order and will process it shortly.</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order Details</h2>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Status:</strong> <span style="color: #28a745;">Pending</span></p>
        </div>

        <h3>Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 5px;"><strong>Subtotal:</strong></td>
              <td style="padding: 5px; text-align: right;">₹${orderData.subtotal.toFixed(2)}</td>
            </tr>
            ${
              orderData.discount > 0
                ? `
            <tr>
              <td style="padding: 5px; color: #28a745;"><strong>Discount:</strong></td>
              <td style="padding: 5px; text-align: right; color: #28a745;">-₹${orderData.discount.toFixed(2)}</td>
            </tr>
            `
                : ''
            }
            <tr style="border-top: 2px solid #dee2e6;">
              <td style="padding: 10px 5px;"><strong>Total Amount:</strong></td>
              <td style="padding: 10px 5px; text-align: right; font-size: 1.2em; color: #28a745;">
                <strong>₹${orderData.totalAmount.toFixed(2)}</strong>
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
          You will receive updates about your order status via email.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 0.85em;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateStatusUpdateTemplate(orderData: any): string {
    const statusColors: any = {
      pending: '#ffc107',
      confirmed: '#17a2b8',
      shipped: '#007bff',
      delivered: '#28a745',
      cancelled: '#dc3545',
    };

    const statusColor = statusColors[orderData.status] || '#6c757d';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${statusColor}; padding: 20px; border-radius: 5px; margin-bottom: 20px; color: white;">
          <h1 style="margin: 0;">Order Status Updated</h1>
        </div>

        <p>Your order status has been updated.</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order Information</h2>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>New Status:</strong>
            <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">
              ${orderData.status}
            </span>
          </p>
          <p><strong>Total Amount:</strong> ₹${orderData.totalAmount.toFixed(2)}</p>
        </div>

        ${
          orderData.status === 'delivered'
            ? `
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>Your order has been delivered!</strong> Thank you for shopping with us.
          </p>
        </div>
        `
            : ''
        }

        ${
          orderData.status === 'shipped'
            ? `
        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #0c5460;">
            <strong>Your order has been shipped!</strong> It should arrive soon.
          </p>
        </div>
        `
            : ''
        }

        <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
          Thank you for your business!
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 0.85em;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
      </html>
    `;
  }
}

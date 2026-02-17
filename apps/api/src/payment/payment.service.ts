import * as crypto from 'crypto';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  CreatePaymentRequest,
  PaymentIntent,
  PaymentStatus,
  InvoiceStatus,
} from '@digital-order/types';
import { generateInvoiceNumber } from '@digital-order/utils';

@Injectable()
export class PaymentService {
  private paddleApiKey: string;
  private paddleEnvironment: 'sandbox' | 'production';
  private paddleApiUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {
    this.paddleApiKey = this.config.get('PADDLE_API_KEY') || '';
    this.paddleEnvironment = (this.config.get('PADDLE_ENVIRONMENT') || 'sandbox') as
      | 'sandbox'
      | 'production';
    this.paddleApiUrl =
      this.paddleEnvironment === 'production'
        ? 'https://api.paddle.com'
        : 'https://sandbox-api.paddle.com';
  }

  async createPaymentIntent(orderId: string, tenantId: string): Promise<PaymentIntent> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === 'COMPLETED') {
      throw new BadRequestException('Order already paid');
    }

    if (!this.paddleApiKey || this.paddleApiKey.includes('...')) {
      // Mock payment intent for development
      return {
        clientSecret: 'mock_client_secret',
        paymentIntentId: 'mock_txn_' + Math.random().toString(36).substr(2, 9),
        amount: Number(order.total) * 100,
        currency: 'usd',
      };
    }

    try {
      // Create Paddle transaction
      const response = await fetch(`${this.paddleApiUrl}/transactions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.paddleApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              price: {
                amount: Math.round(Number(order.total) * 100).toString(), // Paddle uses string amounts
                currency: 'USD',
              },
              quantity: 1,
            },
          ],
          custom_data: {
            orderId: order.id,
            tenantId,
            orderNumber: order.orderNumber,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Paddle API error: ${response.statusText}`);
      }

      const transaction: any = await response.json();

      return {
        clientSecret: transaction.data.id, // Paddle uses transaction ID as client reference
        paymentIntentId: transaction.data.id,
        amount: Math.round(Number(order.total) * 100),
        currency: 'usd',
      };
    } catch (error: any) {
      console.error('Paddle payment intent creation failed:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async processPayment(tenantId: string, dto: CreatePaymentRequest) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        tenantId,
        amount: dto.amount,
        currency: 'USD',
        status: PaymentStatus.COMPLETED,
        paymentMethod: dto.paymentMethod,
        providerTransactionId: dto.metadata?.transactionId || null,
        metadata: dto.metadata || {},
      },
    });

    // Update order payment status
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        paymentStatus: 'COMPLETED',
        paymentMethod: dto.paymentMethod,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Generate invoice
    await this.generateInvoice(order.id, tenantId);

    return payment;
  }

  async handleWebhook(signature: string, payload: any) {
    if (!this.paddleApiKey || this.paddleApiKey.includes('...')) {
      console.log('Paddle not configured, skipping webhook');
      return;
    }

    const webhookSecret = this.config.get('PADDLE_WEBHOOK_SECRET');

    if (!webhookSecret || webhookSecret.includes('...')) {
      console.warn('Webhook secret not configured');
      return;
    }

    // Verify Paddle webhook signature
    try {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(JSON.stringify(payload));
      const calculatedSignature = hmac.digest('hex');

      if (signature !== calculatedSignature) {
        throw new BadRequestException('Invalid webhook signature');
      }
    } catch (err: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle Paddle webhook events
    const eventType = payload.event_type || payload.alert_name;

    switch (eventType) {
      case 'transaction.completed':
      case 'subscription_payment_succeeded':
        await this.handlePaymentSuccess(payload.data || payload);
        break;
      case 'transaction.payment_failed':
      case 'subscription_payment_failed':
        await this.handlePaymentFailure(payload.data || payload);
        break;
    }

    return { received: true };
  }

  private async handlePaymentSuccess(transaction: any) {
    const customData = transaction.custom_data || {};
    const orderId = customData.orderId;
    const tenantId = customData.tenantId;

    if (!orderId || !tenantId) {
      console.warn('Missing order or tenant ID in Paddle webhook');
      return;
    }

    await this.processPayment(tenantId, {
      orderId,
      paymentMethod: 'CARD' as any,
      amount: parseFloat(transaction.amount || transaction.sale_gross) / 100,
      metadata: {
        transactionId: transaction.id || transaction.subscription_payment_id,
        paddleTransactionId: transaction.id,
      },
    });
  }

  private async handlePaymentFailure(transaction: any) {
    const customData = transaction.custom_data || {};
    const orderId = customData.orderId;

    if (!orderId) {
      console.warn('Missing order ID in Paddle webhook');
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
      },
    });
  }

  // ========== INVOICES ==========

  async generateInvoice(orderId: string, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        tenantId,
        invoiceNumber: generateInvoiceNumber(tenantId),
        date: new Date(),
        subtotal: order.subtotal,
        taxBreakdown: [
          {
            name: 'Sales Tax',
            rate: 0.08,
            amount: Number(order.tax),
          },
        ],
        total: order.total,
        status: InvoiceStatus.PAID,
      },
    });

    // TODO: Generate PDF and upload to S3
    // const pdfUrl = await this.generateInvoicePDF(invoice);
    // await this.prisma.invoice.update({
    //   where: { id: invoice.id },
    //   data: { pdfUrl },
    // });

    return invoice;
  }

  async getInvoice(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        order: {
          include: { items: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getInvoiceByOrderId(tenantId: string, orderId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { orderId, tenantId },
      include: {
        order: {
          include: { items: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}

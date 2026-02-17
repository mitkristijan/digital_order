import { Controller, Post, Get, Body, Param, Query, UseGuards, Headers, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Public } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/request.decorators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePaymentRequest } from '@digital-order/types';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-intent')
  @Public()
  @ApiOperation({ summary: 'Create payment intent for order' })
  async createPaymentIntent(@Query('tenantId') tenantId: string, @Body('orderId') orderId: string) {
    return this.paymentService.createPaymentIntent(orderId, tenantId);
  }

  @Post('process')
  @Public()
  @ApiOperation({ summary: 'Process payment for order' })
  async processPayment(@Query('tenantId') tenantId: string, @Body() dto: CreatePaymentRequest) {
    return this.paymentService.processPayment(tenantId, dto);
  }

  @Post('webhook/paddle')
  @Public()
  @ApiOperation({ summary: 'Paddle webhook endpoint' })
  async handlePaddleWebhook(@Headers('paddle-signature') signature: string, @Req() req: Request) {
    return this.paymentService.handleWebhook(signature, req.body);
  }

  @Get('invoices/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice by ID' })
  async getInvoice(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.paymentService.getInvoice(tenantId, id);
  }

  @Get('orders/:orderId/invoice')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice for order' })
  async getInvoiceByOrderId(@CurrentTenant() tenantId: string, @Param('orderId') orderId: string) {
    return this.paymentService.getInvoiceByOrderId(tenantId, orderId);
  }
}

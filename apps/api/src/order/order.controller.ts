import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentTenant, CurrentUserId } from '../common/decorators/request.decorators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, CreateOrderRequest, UpdateOrderStatusRequest, OrderStatus } from '@digital-order/types';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new order' })
  async createOrder(
    @Body() dto: CreateOrderRequest,
    @Query('tenantId') tenantId: string,
    @CurrentUserId() customerId?: string,
  ) {
    return this.orderService.createOrder(tenantId, dto, customerId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.KITCHEN, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders with filters' })
  async getOrders(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: OrderStatus,
    @Query('orderType') orderType?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.orderService.getOrders(tenantId, status, orderType, skip, take);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer own orders' })
  async getMyOrders(
    @CurrentUserId() customerId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.orderService.getCustomerOrders(customerId, skip, take);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrderById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.orderService.getOrderById(tenantId, id);
  }

  @Get('number/:orderNumber')
  @Public()
  @ApiOperation({ summary: 'Get order by order number (for tracking)' })
  async getOrderByNumber(
    @Query('tenantId') tenantId: string,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.orderService.getOrderByNumber(tenantId, orderNumber);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.KITCHEN, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusRequest,
  ) {
    return this.orderService.updateOrderStatus(tenantId, id, dto);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an order' })
  async cancelOrder(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.orderService.cancelOrder(tenantId, id, reason);
  }
}

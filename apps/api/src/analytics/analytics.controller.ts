import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/request.decorators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@digital-order/types';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  async getDashboardMetrics(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getDashboardMetrics(tenantId, start, end);
  }

  @Get('popular-items')
  @ApiOperation({ summary: 'Get most popular menu items' })
  async getPopularItems(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getPopularItems(tenantId, limit || 10, start, end);
  }

  @Get('revenue-by-day')
  @ApiOperation({ summary: 'Get revenue trend by day' })
  async getRevenueByDay(@CurrentTenant() tenantId: string, @Query('days') days?: number) {
    return this.analyticsService.getRevenueByDay(tenantId, days || 7);
  }

  @Get('orders-by-hour')
  @ApiOperation({ summary: 'Get order distribution by hour' })
  async getOrdersByHour(@CurrentTenant() tenantId: string, @Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return this.analyticsService.getOrdersByHour(tenantId, targetDate);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get payment method breakdown' })
  async getPaymentMethodBreakdown(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getPaymentMethodBreakdown(tenantId, start, end);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer statistics' })
  async getCustomerStats(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getCustomerStats(tenantId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders with date range filter for analytics' })
  async getOrders(
    @CurrentTenant() tenantId: string | null,
    @Query('tenantId') queryTenantId: string,
    @Query('period') period?: 'day' | 'week' | 'month' | 'year' | 'all',
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const effectiveTenantId = tenantId || queryTenantId;
    const validPeriod = period && ['day', 'week', 'month', 'year', 'all'].includes(period) ? period : 'all';
    return this.analyticsService.getOrdersWithDateRange(effectiveTenantId, validPeriod, skip, take);
  }
}

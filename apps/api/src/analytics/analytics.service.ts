import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getDashboardMetrics(tenantId: string, startDate?: Date, endDate?: Date) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const start = startDate || todayStart;
    const end = endDate || todayEnd;

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    // "Sold today" = orders completed/delivered today (use completedAt/deliveredAt, not orderedAt)
    const soldTodayWhere = {
      tenantId,
      OR: [
        { status: OrderStatus.COMPLETED, completedAt: { gte: start, lte: end } },
        { status: OrderStatus.DELIVERED, deliveredAt: { gte: start, lte: end } },
      ],
    };
    const soldYesterdayWhere = {
      tenantId,
      OR: [
        { status: OrderStatus.COMPLETED, completedAt: { gte: yesterdayStart, lte: yesterdayEnd } },
        { status: OrderStatus.DELIVERED, deliveredAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      ],
    };
    const completedStatuses: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.READY];

    const [
      totalOrders,
      totalRevenue,
      completedOrders,
      cancelledOrders,
      avgOrderValue,
      yesterdayOrders,
      yesterdayRevenue,
      todayOrdersForPeak,
      itemsSoldResult,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { tenantId, orderedAt: { gte: start, lte: end } },
      }),
      this.prisma.order.aggregate({
        where: soldTodayWhere,
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: soldTodayWhere,
      }),
      this.prisma.order.count({
        where: {
          tenantId,
          orderedAt: { gte: start, lte: end },
          status: OrderStatus.CANCELLED,
        },
      }),
      this.prisma.order.aggregate({
        where: soldTodayWhere,
        _avg: { total: true },
      }),
      this.prisma.order.count({
        where: soldYesterdayWhere,
      }),
      this.prisma.order.aggregate({
        where: soldYesterdayWhere,
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { tenantId, orderedAt: { gte: todayStart, lte: todayEnd } },
        select: { orderedAt: true },
      }),
      this.prisma.orderItem.aggregate({
        where: {
          order: soldTodayWhere,
        },
        _sum: { quantity: true },
      }),
    ]);

    const revenue = Number(totalRevenue._sum.total || 0);
    const avgValue = Number(avgOrderValue._avg.total || 0);
    const yesterdayRev = Number(yesterdayRevenue._sum.total || 0);

    const ordersChangePercent =
      yesterdayOrders > 0 ? ((totalOrders - yesterdayOrders) / yesterdayOrders) * 100 : (totalOrders > 0 ? 100 : 0);
    const revenueChangePercent =
      yesterdayRev > 0 ? ((revenue - yesterdayRev) / yesterdayRev) * 100 : (revenue > 0 ? 100 : 0);

    const ordersByHour: { [hour: number]: number } = {};
    for (let i = 0; i < 24; i++) ordersByHour[i] = 0;
    todayOrdersForPeak.forEach((o) => {
      ordersByHour[o.orderedAt.getHours()]++;
    });
    const peakHour = Object.entries(ordersByHour).reduce((a, b) => (b[1] > a[1] ? [parseInt(b[0]), b[1]] : a), [0, 0])[0];

    const itemsSold = Number(itemsSoldResult._sum.quantity || 0);

    return {
      totalOrders,
      totalRevenue: revenue,
      completedOrders,
      itemsSold,
      cancelledOrders,
      averageOrderValue: avgValue,
      ordersChangePercent,
      revenueChangePercent,
      peakHour,
      period: { start, end },
    };
  }

  async getPopularItems(tenantId: string, limit: number = 10, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          tenantId,
          orderedAt: { gte: start, lte: end },
          status: { in: ['DELIVERED', 'READY', 'PREPARING'] },
        },
      },
      select: {
        menuItemId: true,
        menuItemName: true,
        quantity: true,
        unitPrice: true,
      },
    });

    const aggregated = new Map<
      string,
      { name: string; orderCount: number; totalQuantity: number; revenue: number }
    >();
    for (const item of orderItems) {
      const key = item.menuItemId;
      const existing = aggregated.get(key);
      const itemRevenue = Number(item.unitPrice) * item.quantity;
      if (existing) {
        existing.orderCount += 1;
        existing.totalQuantity += item.quantity;
        existing.revenue += itemRevenue;
      } else {
        aggregated.set(key, {
          name: item.menuItemName,
          orderCount: 1,
          totalQuantity: item.quantity,
          revenue: itemRevenue,
        });
      }
    }

    return Array.from(aggregated.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit)
      .map((item) => ({
        name: item.name,
        orderCount: item.orderCount,
        revenue: item.revenue,
      }));
  }

  async getRevenueByDay(tenantId: string, days: number = 7) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        orderedAt: { gte: startDate, lte: endDate },
        status: { in: ['DELIVERED', 'READY'] },
      },
      select: {
        orderedAt: true,
        total: true,
      },
    });

    const revenueByDay: { [key: string]: number } = {};
    for (let d = 0; d <= days; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      revenueByDay[date.toISOString().split('T')[0]] = 0;
    }

    orders.forEach((order) => {
      const date = order.orderedAt.toISOString().split('T')[0];
      if (revenueByDay[date] !== undefined) {
        revenueByDay[date] += Number(order.total);
      }
    });

    return Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date,
        revenue,
      }));
  }

  async getOrdersByHour(tenantId: string, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        orderedAt: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        orderedAt: true,
      },
    });

    const ordersByHour: { [key: number]: number } = {};
    for (let i = 0; i < 24; i++) {
      ordersByHour[i] = 0;
    }

    orders.forEach(order => {
      const hour = order.orderedAt.getHours();
      ordersByHour[hour]++;
    });

    return Object.entries(ordersByHour).map(([hour, count]) => ({
      hour: parseInt(hour),
      orderCount: count,
    }));
  }

  async getPaymentMethodBreakdown(tenantId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const breakdown = await this.prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
        status: 'COMPLETED',
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    return breakdown.map(item => ({
      method: item.paymentMethod,
      count: item._count.id,
      total: item._sum.amount,
    }));
  }

  async getCustomerStats(tenantId: string) {
    const [totalCustomers, returningCustomers, newCustomersToday] = await Promise.all([
      this.prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: {
          tenantId,
          customerId: { not: null },
        },
        having: {
          customerId: { _count: { gt: 1 } },
        },
      }).then(res => res.length),
      this.prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalCustomers,
      returningCustomers,
      newCustomersToday,
    };
  }

  private async resolveTenantId(tenantIdOrSubdomain: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdOrSubdomain);
    if (isUuid) return tenantIdOrSubdomain;
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: tenantIdOrSubdomain },
      select: { id: true },
    });
    return tenant?.id ?? tenantIdOrSubdomain;
  }

  async recordEvent(tenantId: string, eventType: string, entityId: string, metadata: any) {
    return this.prisma.analyticsEvent.create({
      data: {
        tenantId,
        eventType,
        entityId,
        metadata,
      },
    });
  }

  async getOrdersWithDateRange(
    tenantIdOrSubdomain: string,
    period: 'day' | 'week' | 'month' | 'year' | 'all',
    skip?: number,
    take?: number,
  ) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const now = new Date();
    let where: { tenantId: string; orderedAt?: { gte: Date; lte: Date } };

    if (period === 'all') {
      where = { tenantId };
    } else {
      let start: Date;
      const end = new Date(now);

      switch (period) {
        case 'day':
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          break;
        case 'month':
          start = new Date(now);
          start.setMonth(start.getMonth() - 1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'year':
          start = new Date(now);
          start.setFullYear(start.getFullYear() - 1);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
      }

      where = {
        tenantId,
        orderedAt: { gte: start, lte: end },
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: skip ?? 0,
        take: take ?? 100,
        orderBy: { orderedAt: 'desc' },
        include: {
          items: {
            include: {
              menuItem: true,
              variant: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          payments: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page: Math.floor((skip ?? 0) / (take ?? 100)) + 1,
      pageSize: take ?? 100,
    };
  }
}

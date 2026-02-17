import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateOrderRequest, OrderStatus, UpdateOrderStatusRequest } from '@digital-order/types';
import { generateOrderNumber, calculateSubtotal } from '@digital-order/utils';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private websocketGateway: WebsocketGateway
  ) {}

  async createOrder(tenantIdOrSubdomain: string, dto: CreateOrderRequest, customerId?: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    // Validate menu items and calculate prices
    const itemsWithPrices = await this.validateAndPriceItems(tenantId, dto.items);

    const subtotal = calculateSubtotal(itemsWithPrices);
    const tax = 0;
    const total = subtotal; // Total = sum of items only, no tax/tip/fees

    // Create order
    const order = await this.prisma.order.create({
      data: {
        tenantId,
        customerId,
        orderNumber: generateOrderNumber(),
        tableNumber: dto.tableNumber,
        orderType: dto.orderType,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: 'PENDING',
        subtotal,
        tax,
        tip: dto.tip || 0,
        deliveryFee: 0,
        total,
        specialInstructions: dto.specialInstructions,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        deliveryAddress: dto.deliveryAddress,
        items: {
          create: itemsWithPrices.map(item => ({
            menuItemId: item.menuItemId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            modifiers: item.modifiers || [],
            specialInstructions: item.specialInstructions,
            status: OrderStatus.PENDING,
            menuItemName: item.menuItemName,
            variantName: item.variantName,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Emit WebSocket event for new order
    this.websocketGateway.emitOrderCreated(tenantId, order);

    return order;
  }

  async updateOrderStatus(tenantId: string, orderId: string, dto: UpdateOrderStatusRequest) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updateData: any = { status: dto.status };

    // Set timestamps based on status
    switch (dto.status) {
      case OrderStatus.CONFIRMED:
        updateData.confirmedAt = new Date();
        updateData.paymentStatus = 'COMPLETED';
        break;
      case OrderStatus.PREPARING:
        updateData.preparingAt = new Date();
        break;
      case OrderStatus.READY:
        updateData.readyAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        break;
      case OrderStatus.COMPLETED:
        updateData.completedAt = new Date();
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = dto.reason;
        break;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });

    // Emit WebSocket event for status update
    this.websocketGateway.emitOrderStatusChanged(tenantId, updatedOrder);

    return updatedOrder;
  }

  async getOrders(
    tenantId: string,
    status?: OrderStatus,
    orderType?: string,
    skip?: number,
    take?: number
  ) {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;

    // Convert to numbers and provide defaults (query params come as strings)
    const actualSkip = skip !== undefined && skip !== null ? Number(skip) : 0;
    const actualTake = take !== undefined && take !== null ? Number(take) : 20;

    // Validate they're valid numbers
    const validSkip = isNaN(actualSkip) ? 0 : actualSkip;
    const validTake = isNaN(actualTake) ? 20 : actualTake;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: validSkip,
        take: validTake,
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
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page: Math.floor(validSkip / validTake) + 1,
      pageSize: validTake,
    };
  }

  async getOrderById(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
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
        invoice: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getOrderByNumber(tenantIdOrSubdomain: string, orderNumber: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, tenantId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getCustomerOrders(customerId: string, skip: number = 0, take: number = 10) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId },
        skip,
        take,
        orderBy: { orderedAt: 'desc' },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where: { customerId } }),
    ]);

    return { orders, total, page: Math.floor(skip / take) + 1, pageSize: take };
  }

  async cancelOrder(tenantId: string, orderId: string, reason: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      ![OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED].includes(
        order.status as OrderStatus
      )
    ) {
      throw new BadRequestException('Order cannot be cancelled in current status');
    }

    return this.updateOrderStatus(tenantId, orderId, {
      status: OrderStatus.CANCELLED,
      reason,
    });
  }

  // ========== UTILITIES ==========

  private async resolveTenantId(tenantIdOrSubdomain: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      tenantIdOrSubdomain
    );
    if (isUuid) return tenantIdOrSubdomain;
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ subdomain: tenantIdOrSubdomain }, { menuSlug: tenantIdOrSubdomain }],
        status: { in: ['ACTIVE', 'TRIAL'] }, // TRIAL tenants can receive orders (menu shows for them)
      },
      select: { id: true },
    });
    if (!tenant) {
      throw new NotFoundException(
        `Tenant not found for "${tenantIdOrSubdomain}". Ensure the tenant exists with matching subdomain or menu slug.`
      );
    }
    return tenant.id;
  }

  private async validateAndPriceItems(tenantId: string, items: any[]) {
    const itemsWithPrices = [];

    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findFirst({
        where: { id: item.menuItemId, tenantId, active: true },
        include: {
          variants: true,
        },
      });

      if (!menuItem) {
        throw new BadRequestException(`Menu item ${item.menuItemId} not found or inactive`);
      }

      let unitPrice = Number(menuItem.basePrice);
      let variantName = null;

      // Add variant price if specified
      if (item.variantId) {
        const variant = menuItem.variants.find(v => v.id === item.variantId && v.active);
        if (!variant) {
          throw new BadRequestException(`Variant ${item.variantId} not found or inactive`);
        }
        unitPrice += Number(variant.priceModifier);
        variantName = variant.name;
      }

      // Add modifiers price
      if (item.modifiers && item.modifiers.length > 0) {
        const modifiers = await this.prisma.modifier.findMany({
          where: {
            id: { in: item.modifiers },
            active: true,
          },
        });

        const modifierPrice = modifiers.reduce((sum, mod) => sum + Number(mod.price), 0);
        unitPrice += modifierPrice;
      }

      itemsWithPrices.push({
        menuItemId: item.menuItemId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice,
        modifiers: item.modifiers || [],
        specialInstructions: item.specialInstructions,
        menuItemName: menuItem.name,
        variantName,
      });
    }

    return itemsWithPrices;
  }
}

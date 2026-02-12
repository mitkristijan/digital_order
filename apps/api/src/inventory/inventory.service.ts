import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockMovementType } from '@digital-order/types';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ========== INVENTORY ITEMS ==========

  async createInventoryItem(tenantId: string, data: any) {
    return this.prisma.inventoryItem.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async getInventoryItems(tenantId: string, lowStockOnly?: boolean) {
    const where: any = { tenantId };
    
    if (lowStockOnly) {
      where.currentStock = { lte: this.prisma.inventoryItem.fields.minStock };
    }

    return this.prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getInventoryItemById(tenantId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
      include: {
        recipeItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  async updateInventoryItem(tenantId: string, id: string, data: any) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data,
    });
  }

  async deleteInventoryItem(tenantId: string, id: string) {
    await this.prisma.inventoryItem.delete({
      where: { id },
    });
  }

  // ========== STOCK MOVEMENTS ==========

  async recordStockMovement(tenantId: string, data: any, createdBy: string = 'system') {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: data.inventoryItemId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    // Calculate new stock level
    let newStock = Number(item.currentStock);
    if (data.type === StockMovementType.IN) {
      newStock += data.quantity;
    } else if (data.type === StockMovementType.OUT) {
      newStock -= data.quantity;
    } else if (data.type === StockMovementType.ADJUSTMENT) {
      newStock = data.quantity;
    }

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    // Create movement record
    const movement = await this.prisma.stockMovement.create({
      data: {
        tenant: { connect: { id: tenantId } },
        inventoryItem: { connect: { id: data.inventoryItemId } },
        type: data.type,
        quantity: data.quantity,
        referenceId: data.referenceId,
        notes: data.notes,
        createdBy,
      },
    });

    // Update inventory item stock
    await this.prisma.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: { currentStock: newStock },
    });

    return movement;
  }

  async getStockMovements(
    tenantId: string,
    inventoryItemId?: string,
    skip: number = 0,
    take: number = 50,
  ) {
    const where: any = { tenantId };
    if (inventoryItemId) where.inventoryItemId = inventoryItemId;

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          inventoryItem: true,
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { movements, total, page: Math.floor(skip / take) + 1, pageSize: take };
  }

  // ========== RECIPE COSTING ==========

  async createRecipeItem(menuItemId: string, data: any) {
    return this.prisma.recipeItem.create({
      data: {
        menuItemId,
        inventoryItemId: data.inventoryItemId,
        quantityRequired: data.quantityRequired,
      },
    });
  }

  async getRecipeItems(menuItemId: string) {
    return this.prisma.recipeItem.findMany({
      where: { menuItemId },
      include: {
        inventoryItem: true,
      },
    });
  }

  async calculateMenuItemCost(menuItemId: string) {
    const recipeItems = await this.getRecipeItems(menuItemId);
    
    let totalCost = 0;
    for (const item of recipeItems) {
      const cost = Number(item.inventoryItem.costPerUnit) * Number(item.quantityRequired);
      totalCost += cost;
    }

    return { totalCost, recipeItems };
  }

  async getLowStockAlerts(tenantId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        currentStock: {
          lte: this.prisma.inventoryItem.fields.minStock,
        },
      },
      orderBy: { currentStock: 'asc' },
    });

    return items;
  }

  // Auto-deduct stock when order is confirmed
  async deductStockForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    for (const orderItem of order.items) {
      if (!orderItem.menuItemId) continue; // Skip deleted menu items (order history preserved via menuItemName)
      const recipeItems = await this.getRecipeItems(orderItem.menuItemId);
      
      for (const recipeItem of recipeItems) {
        const quantityNeeded = Number(recipeItem.quantityRequired) * orderItem.quantity;
        
        await this.recordStockMovement(order.tenantId, {
          inventoryItemId: recipeItem.inventoryItemId,
          type: StockMovementType.OUT,
          quantity: quantityNeeded,
          referenceId: orderId,
          notes: `Auto-deducted for order ${order.orderNumber}`,
        });
      }
    }
  }
}

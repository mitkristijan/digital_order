import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RecommendationItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  imageUrl?: string;
  reason: string;
  confidence: number;
}

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async getSuggestions(
    tenantId: string,
    cartItems: Array<{ menuItemId: string; quantity: number }>
  ): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = [];

    // Get menu items in cart
    const menuItemIds = cartItems.map(item => item.menuItemId);
    const cartMenuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        tenantId,
        availability: true,
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        basePrice: true,
        imageUrl: true,
        category: true,
        variants: true,
      },
    });

    // Strategy 1: Size Upgrades
    for (const cartItem of cartMenuItems) {
      const hasSmallVariant = cartItem.variants.some(v => v.name.toLowerCase().includes('small'));
      if (hasSmallVariant) {
        const largeVariant = cartItem.variants.find(v => v.name.toLowerCase().includes('large'));
        if (largeVariant && largeVariant.active) {
          recommendations.push({
            menuItemId: cartItem.id,
            name: `${cartItem.name} (Large)`,
            basePrice: Number(cartItem.basePrice) + Number(largeVariant.priceModifier),
            imageUrl: cartItem.imageUrl,
            reason: 'Upgrade to Large size',
            confidence: 0.8,
          });
        }
      }
    }

    // Strategy 2: Complementary Items
    const _categoryIds = cartMenuItems.map(item => item.categoryId);
    const hasCoffee = cartMenuItems.some(
      item =>
        item.category.name.toLowerCase().includes('coffee') ||
        item.category.name.toLowerCase().includes('drink')
    );

    if (hasCoffee) {
      // Suggest pastries
      const pastries = await this.prisma.menuItem.findMany({
        where: {
          tenantId,
          availability: true,
          id: { notIn: menuItemIds },
          category: {
            name: { contains: 'Pastries', mode: 'insensitive' },
          },
        },
        select: {
          id: true,
          name: true,
          basePrice: true,
          imageUrl: true,
        },
        take: 2,
        orderBy: { basePrice: 'asc' },
      });

      for (const pastry of pastries) {
        recommendations.push({
          menuItemId: pastry.id,
          name: pastry.name,
          basePrice: Number(pastry.basePrice),
          imageUrl: pastry.imageUrl,
          reason: 'Perfect with your coffee',
          confidence: 0.75,
        });
      }
    }

    // Strategy 3: Popular Combos
    const popularItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          tenantId,
          status: { not: 'CANCELLED' },
        },
        menuItemId: { notIn: menuItemIds },
      },
      _count: true,
      orderBy: {
        _count: {
          menuItemId: 'desc',
        },
      },
      take: 3,
    });

    const popularMenuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: popularItems.map(p => p.menuItemId) },
        availability: true,
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        imageUrl: true,
      },
    });

    for (const item of popularMenuItems) {
      if (!recommendations.find(r => r.menuItemId === item.id)) {
        recommendations.push({
          menuItemId: item.id,
          name: item.name,
          basePrice: Number(item.basePrice),
          imageUrl: item.imageUrl,
          reason: 'Popular choice',
          confidence: 0.6,
        });
      }
    }

    // Sort by confidence and return top 3
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }
}

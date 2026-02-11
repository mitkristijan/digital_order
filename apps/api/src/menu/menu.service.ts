import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

/** Max time to wait for Redis before falling back to DB (avoids hanging on slow Upstash/network) */
const REDIS_GET_TIMEOUT_MS = 4000;
/** Max time to wait for cache invalidation - don't block API response on slow Redis */
const REDIS_INVALIDATE_TIMEOUT_MS = 3000;

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private async redisGetWithTimeout(key: string): Promise<string | null> {
    try {
      return await Promise.race([
        this.redis.get(key),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Redis get timeout')), REDIS_GET_TIMEOUT_MS),
        ),
      ]);
    } catch {
      return null;
    }
  }

  private redisSetNoWait(key: string, value: string, ttl?: number): void {
    this.redis.set(key, value, ttl).catch((err) => console.warn('Redis set failed:', err?.message));
  }

  // ========== CATEGORIES ==========

  async createCategory(tenantId: string, data: any) {
    const category = await this.prisma.category.create({
      data: {
        ...data,
        tenantId,
      },
    });

    await this.invalidateMenuCache(tenantId);
    return category;
  }

  async getCategories(tenantIdOrSubdomain: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const cacheKey = `tenant:${tenantId}:categories`;
    const cached = await this.redisGetWithTimeout(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await this.prisma.category.findMany({
      where: { tenantId, active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where: { active: true },
          select: { id: true, name: true, basePrice: true, imageUrl: true },
        },
      },
    });

    // Convert Decimal types to numbers before caching
    const serializedCategories = categories.map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.map((item) => ({
        ...item,
        basePrice: Number(item.basePrice),
      })),
    }));

    this.redisSetNoWait(cacheKey, JSON.stringify(serializedCategories), 300);
    return serializedCategories;
  }

  async getCategoryById(tenantIdOrSubdomain: string, id: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        menuItems: {
          where: { active: true },
          include: {
            variants: { where: { active: true } },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(tenantId: string, id: string, data: any) {
    const category = await this.prisma.category.update({
      where: { id },
      data,
    });

    await this.invalidateMenuCache(tenantId);
    return category;
  }

  async deleteCategory(tenantId: string, id: string) {
    await this.prisma.category.delete({
      where: { id },
    });

    await this.invalidateMenuCache(tenantId);
  }

  // ========== MENU ITEMS ==========

  async createMenuItem(tenantIdOrSubdomain: string, data: any) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const { variants, suggestedItemIds, ...itemData } = data;

    // Create menu item first without suggestedItems (resilient when MenuItemSuggestedItem table is missing)
    const menuItem = await this.prisma.menuItem.create({
      data: {
        ...itemData,
        tenantId,
        variants: variants
          ? {
              create: variants,
            }
          : undefined,
      },
      include: {
        variants: true,
        category: true,
      },
    });

    // Add suggested items separately - table may not exist on fresh/migrating DBs
    if (suggestedItemIds?.length > 0) {
      try {
        await this.prisma.menuItemSuggestedItem.createMany({
          data: suggestedItemIds.map((suggestedItemId: string) => ({
            menuItemId: menuItem.id,
            suggestedItemId,
          })),
          skipDuplicates: true,
        });
      } catch (err) {
        console.warn('MenuItemSuggestedItem table unavailable, skipping suggestions:', (err as Error)?.message);
      }
    }

    await this.invalidateMenuCache(tenantId);
    return this.serializeMenuItem(menuItem);
  }

  async getMenuItems(tenantIdOrSubdomain: string, categoryId?: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);

    const cacheKey = categoryId
      ? `tenant:${tenantId}:menu:category:${categoryId}`
      : `tenant:${tenantId}:menu:all`;

    console.log(`📥 Getting menu items for tenant: ${tenantIdOrSubdomain} (UUID: ${tenantId}), cacheKey: ${cacheKey}`);
    
    const cached = await this.redisGetWithTimeout(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT for ${cacheKey}`);
      return JSON.parse(cached);
    }

    console.log(`❌ Cache MISS for ${cacheKey}, querying database...`);
    
    // Temporarily disable middleware
    const previousTenantId = (globalThis as any).currentTenantId;
    (globalThis as any).currentTenantId = undefined;
    
    try {
      const menuItems = await this.prisma.menuItem.findMany({
        where: {
          tenantId,
          active: true,
          ...(categoryId && { categoryId }),
        },
        include: {
          category: true,
          variants: { where: { active: true } },
          suggestedItems: {
            include: {
              suggestedItem: {
                select: { id: true, name: true, basePrice: true, imageUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`📊 Found ${menuItems.length} items in database for tenant ${tenantId}`);

      // Convert Decimal types to numbers before caching
      const serializedItems = menuItems.map((item) =>
        this.serializeMenuItem(item),
      );

      this.redisSetNoWait(cacheKey, JSON.stringify(serializedItems), 300);
      console.log(`💾 Caching ${serializedItems.length} items with key: ${cacheKey}`);
      return serializedItems;
    } finally {
      (globalThis as any).currentTenantId = previousTenantId;
    }
  }

  async getMenuItemById(tenantIdOrSubdomain: string, id: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        variants: { where: { active: true } },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: { where: { active: true } },
              },
            },
          },
        },
        suggestedItems: {
          include: {
            suggestedItem: {
              select: { id: true, name: true, basePrice: true, imageUrl: true },
            },
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.serializeMenuItem(menuItem);
  }

  async updateMenuItem(tenantIdOrSubdomain: string, id: string, data: any) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const { suggestedItemIds, suggestedItems, ...rest } = data;

    // Only pass fields that Prisma accepts for MenuItem update
    const updateData: Record<string, any> = {};
    const allowedFields = ['name', 'description', 'basePrice', 'categoryId', 'prepTime', 'availability', 'allergens', 'dietaryTags', 'imageUrl'];
    for (const key of allowedFields) {
      if (rest[key] !== undefined) updateData[key] = rest[key];
    }

    // Sync suggested items if provided
    if (suggestedItemIds !== undefined) {
      await this.prisma.menuItemSuggestedItem.deleteMany({
        where: { menuItemId: id },
      });
      if (suggestedItemIds?.length > 0) {
        await this.prisma.menuItemSuggestedItem.createMany({
          data: suggestedItemIds.map((suggestedItemId: string) => ({
            menuItemId: id,
            suggestedItemId,
          })),
        });
      }
    }

    const menuItem = await this.prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: {
        variants: true,
        category: true,
        suggestedItems: {
          include: {
            suggestedItem: {
              select: { id: true, name: true, basePrice: true, imageUrl: true },
            },
          },
        },
      },
    });

    await this.invalidateMenuCache(tenantId);
    return this.serializeMenuItem(menuItem);
  }

  async deleteMenuItem(tenantIdOrSubdomain: string, id: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    console.log(`🗑️  Attempting to delete item: ${id} for tenant: ${tenantId}`);
    
    // Temporarily disable middleware by clearing globalThis
    const previousTenantId = (globalThis as any).currentTenantId;
    (globalThis as any).currentTenantId = undefined;
    
    try {
      // Check if item exists and belongs to tenant
      const item = await this.prisma.menuItem.findFirst({
        where: { id, tenantId },
      });

      console.log(`🔍 Item found:`, item ? `Yes (${item.name})` : 'No');

      if (!item) {
        console.log(`❌ Item not found for tenant ${tenantId}`);
        throw new NotFoundException('Menu item not found or access denied');
      }

      await this.prisma.menuItem.delete({
        where: { id },
      });

      console.log(`✅ Successfully deleted item: ${item.name}`);
      await this.invalidateMenuCache(tenantId);
    } finally {
      // Restore previous tenant ID
      (globalThis as any).currentTenantId = previousTenantId;
    }
  }

  async toggleMenuItemAvailability(tenantIdOrSubdomain: string, id: string, availability: boolean) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const menuItem = await this.prisma.menuItem.update({
      where: { id },
      data: { availability },
    });

    await this.invalidateMenuCache(tenantId);
    return menuItem;
  }

  // ========== MODIFIERS ==========

  async createModifierGroup(tenantId: string, data: any) {
    const { modifiers, ...groupData } = data;

    const modifierGroup = await this.prisma.modifierGroup.create({
      data: {
        ...groupData,
        tenantId,
        modifiers: modifiers
          ? {
              create: modifiers,
            }
          : undefined,
      },
      include: {
        modifiers: true,
      },
    });

    return modifierGroup;
  }

  async getModifierGroups(tenantId: string) {
    return this.prisma.modifierGroup.findMany({
      where: { tenantId },
      include: {
        modifiers: { where: { active: true } },
      },
    });
  }

  async attachModifierGroupToMenuItem(menuItemId: string, modifierGroupId: string) {
    return this.prisma.menuItemModifierGroup.create({
      data: {
        menuItemId,
        modifierGroupId,
      },
    });
  }

  // ========== UTILITIES ==========

  private async resolveTenantId(tenantIdOrSubdomain: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdOrSubdomain);
    if (isUuid) {
      return tenantIdOrSubdomain;
    }
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: tenantIdOrSubdomain },
      select: { id: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant.id;
  }

  async getFullMenu(tenantIdOrSubdomain: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const cacheKey = `tenant:${tenantId}:menu:full`;
    const cached = await this.redisGetWithTimeout(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const menu = await this.prisma.category.findMany({
      where: { tenantId, active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where: { active: true, availability: true },
          include: {
            variants: { where: { active: true } },
            modifierGroups: {
              include: {
                modifierGroup: {
                  include: {
                    modifiers: { where: { active: true } },
                  },
                },
              },
            },
            suggestedItems: {
              include: {
                suggestedItem: {
                  select: { id: true, name: true, basePrice: true, imageUrl: true },
                },
              },
            },
          },
        },
      },
    });

    // Convert Decimal types to numbers before caching
    const serializedMenu = menu.map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.map((item) =>
        this.serializeMenuItem(item),
      ),
    }));

    this.redisSetNoWait(cacheKey, JSON.stringify(serializedMenu), 300);
    return serializedMenu;
  }

  private serializeMenuItem(item: any) {
    const base: any = {
      ...item,
      basePrice: Number(item.basePrice),
    };
    if (item.variants) {
      base.variants = item.variants.map((v: any) => ({
        ...v,
        priceModifier: Number(v.priceModifier),
      }));
    }
    if (item.modifierGroups) {
      base.modifierGroups = item.modifierGroups.map((mg: any) => ({
        ...mg,
        modifierGroup: {
          ...mg.modifierGroup,
          modifiers: mg.modifierGroup.modifiers.map((m: any) => ({
            ...m,
            price: Number(m.price),
          })),
        },
      }));
    }
    if (item.suggestedItems) {
      base.suggestedItems = item.suggestedItems.map((si: any) => ({
        suggestedItem: {
          ...si.suggestedItem,
          basePrice: Number(si.suggestedItem?.basePrice ?? 0),
        },
      }));
    }
    return base;
  }

  private async invalidateMenuCache(tenantId: string): Promise<void> {
    const doInvalidate = async () => {
      console.log(`🗑️  Invalidating menu cache for tenant: ${tenantId}`);
      const menuKeys = await this.redis.keys(`tenant:${tenantId}:menu:*`);
      const categoryKeys = await this.redis.keys(`tenant:${tenantId}:categories`);
      console.log(`   Found ${menuKeys.length} menu keys and ${categoryKeys.length} category keys to delete`);

      await this.redis.flushPattern(`tenant:${tenantId}:menu:*`);
      await this.redis.flushPattern(`tenant:${tenantId}:categories`);

      console.log(`✅ Cache invalidated successfully`);
    };

    try {
      await Promise.race([
        doInvalidate(),
        new Promise<void>((resolve) =>
          setTimeout(() => {
            console.warn(`Cache invalidation timed out after ${REDIS_INVALIDATE_TIMEOUT_MS}ms - continuing without blocking`);
            resolve();
          }, REDIS_INVALIDATE_TIMEOUT_MS),
        ),
      ]);
    } catch (err) {
      console.warn('Redis cache invalidation failed:', (err as Error)?.message);
    }
  }
}

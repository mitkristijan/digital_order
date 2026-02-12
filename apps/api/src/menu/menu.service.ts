import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
      const baseInclude = {
        category: true,
        variants: { where: { active: true } },
      };
      const fullInclude = {
        ...baseInclude,
        suggestedItems: {
          include: {
            suggestedItem: {
              select: { id: true, name: true, basePrice: true, imageUrl: true },
            },
          },
        },
      };

      let menuItems: any[];
      try {
        menuItems = await this.prisma.menuItem.findMany({
          where: {
            tenantId,
            active: true,
            ...(categoryId && { categoryId }),
          },
          include: fullInclude,
          orderBy: { createdAt: 'desc' },
        });
      } catch (err: any) {
        if (err?.message?.includes('MenuItemSuggestedItem') || err?.message?.includes('does not exist')) {
          menuItems = await this.prisma.menuItem.findMany({
            where: {
              tenantId,
              active: true,
              ...(categoryId && { categoryId }),
            },
            include: baseInclude,
            orderBy: { createdAt: 'desc' },
          });
        } else {
          throw err;
        }
      }

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
    const baseInclude = {
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
    };
    const fullInclude = {
      ...baseInclude,
      suggestedItems: {
        include: {
          suggestedItem: {
            select: { id: true, name: true, basePrice: true, imageUrl: true },
          },
        },
      },
    };

    let menuItem: any;
    try {
      menuItem = await this.prisma.menuItem.findFirst({
        where: { id, tenantId },
        include: fullInclude,
      });
    } catch (err: any) {
      if (err?.message?.includes('MenuItemSuggestedItem') || err?.message?.includes('does not exist')) {
        menuItem = await this.prisma.menuItem.findFirst({
          where: { id, tenantId },
          include: baseInclude,
        });
      } else {
        throw err;
      }
    }

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.serializeMenuItem(menuItem);
  }

  async updateMenuItem(tenantIdOrSubdomain: string, id: string, data: any) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    const { suggestedItemIds, suggestedItems, ...rest } = data;

    // Temporarily disable Prisma middleware to avoid tenant filter overwriting our explicit tenantId
    const previousTenantId = (globalThis as any).currentTenantId;
    (globalThis as any).currentTenantId = undefined;

    try {
      // Verify menu item exists and belongs to tenant before update (prevents 500 from Prisma P2025)
      const existingItem = await this.prisma.menuItem.findFirst({
        where: { id, tenantId },
      });
      if (!existingItem) {
        throw new NotFoundException('Menu item not found or access denied');
      }

      // Only pass fields that Prisma accepts for MenuItem update
      const updateData: Record<string, any> = {};
      const allowedFields = ['name', 'description', 'basePrice', 'categoryId', 'prepTime', 'availability', 'allergens', 'dietaryTags', 'imageUrl'];
      for (const key of allowedFields) {
        if (rest[key] !== undefined) updateData[key] = rest[key];
      }
      // Normalize imageUrl: empty string or null -> null (clearing/removing photo)
      if ('imageUrl' in updateData && (updateData.imageUrl === '' || updateData.imageUrl === null)) {
        updateData.imageUrl = null;
      }

      // Sync suggested items if provided (resilient when table has constraints)
      if (suggestedItemIds !== undefined) {
        await this.prisma.menuItemSuggestedItem.deleteMany({
          where: { menuItemId: id },
        });
        if (suggestedItemIds?.length > 0) {
          try {
            await this.prisma.menuItemSuggestedItem.createMany({
              data: suggestedItemIds.map((suggestedItemId: string) => ({
                menuItemId: id,
                suggestedItemId,
              })),
              skipDuplicates: true,
            });
          } catch (err) {
            console.warn('MenuItemSuggestedItem sync failed, skipping:', (err as Error)?.message);
          }
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
    } finally {
      (globalThis as any).currentTenantId = previousTenantId;
    }
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

      await this.deleteMenuItemWithMigrationFallback(tenantId, id, item.name);
    } finally {
      // Restore previous tenant ID
      (globalThis as any).currentTenantId = previousTenantId;
    }
  }

  /** Delete menu item. If P2003 (FK constraint), run migration SQL then retry. */
  private async deleteMenuItemWithMigrationFallback(tenantId: string, id: string, itemName: string) {
    try {
      await this.prisma.menuItem.delete({ where: { id } });
      console.log(`✅ Successfully deleted item: ${itemName}`);
      await this.invalidateMenuCache(tenantId);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        console.log(`⚠️  P2003: Running migration to allow menu item deletion with order refs...`);
        await this.applyOrderItemNullableMigration();
        await this.prisma.menuItem.delete({ where: { id } });
        console.log(`✅ Successfully deleted item: ${itemName} (after migration)`);
        await this.invalidateMenuCache(tenantId);
      } else {
        throw err;
      }
    }
  }

  /** Apply migration: OrderItem.menuItemId nullable + ON DELETE SET NULL. Idempotent. */
  private async applyOrderItemNullableMigration() {
    const statements = [
      `ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_menuItemId_fkey"`,
      `ALTER TABLE "OrderItem" ALTER COLUMN "menuItemId" DROP NOT NULL`,
      `ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    ];
    for (const sql of statements) {
      try {
        await this.prisma.$executeRawUnsafe(sql);
      } catch (e: any) {
        const msg = e?.message || '';
        if (msg.includes('already nullable') || msg.includes('already exists') || msg.includes('duplicate key')) {
          continue;
        }
        throw e;
      }
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
    const tenant = await this.prisma.tenant.findFirst({
      where: { OR: [{ subdomain: tenantIdOrSubdomain }, { menuSlug: tenantIdOrSubdomain }] },
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

    const baseMenuItemsInclude = {
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
    };
    const fullMenuItemsInclude = {
      ...baseMenuItemsInclude,
      suggestedItems: {
        include: {
          suggestedItem: {
            select: { id: true, name: true, basePrice: true, imageUrl: true },
          },
        },
      },
    };

    let menu: any[];
    try {
      menu = await this.prisma.category.findMany({
        where: { tenantId, active: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          menuItems: {
            where: { active: true, availability: true },
            include: fullMenuItemsInclude,
          },
        },
      });
    } catch (err: any) {
      if (err?.message?.includes('MenuItemSuggestedItem') || err?.message?.includes('does not exist')) {
        menu = await this.prisma.category.findMany({
          where: { tenantId, active: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              where: { active: true, availability: true },
              include: baseMenuItemsInclude,
            },
          },
        });
      } else {
        throw err;
      }
    }

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
      base.modifierGroups = item.modifierGroups
        .filter((mg: any) => mg?.modifierGroup)
        .map((mg: any) => ({
          ...mg,
          modifierGroup: {
            ...mg.modifierGroup,
            modifiers: (mg.modifierGroup.modifiers || []).map((m: any) => ({
              ...m,
              price: Number(m.price),
            })),
          },
        }));
    }
    if (item.suggestedItems) {
      base.suggestedItems = item.suggestedItems
        .filter((si: any) => si?.suggestedItem)
        .map((si: any) => ({
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

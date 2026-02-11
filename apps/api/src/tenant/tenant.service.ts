import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateTenantRequest, Tenant } from '@digital-order/types';
import { slugify } from '@digital-order/utils';
import * as crypto from 'crypto';

const REDIS_GET_TIMEOUT_MS = 4000;

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private async redisGetWithTimeout(key: string): Promise<string | null> {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Redis get timeout')), REDIS_GET_TIMEOUT_MS);
      });
      return await Promise.race([this.redis.get(key), timeoutPromise]);
    } catch {
      return null;
    }
  }

  private redisSetNoWait(key: string, value: string, ttl?: number): void {
    this.redis.set(key, value, ttl).catch((err) => console.warn('Redis set failed:', err?.message));
  }

  async create(dto: CreateTenantRequest, ownerId: string): Promise<Tenant> {
    // Validate subdomain availability
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { subdomain: dto.subdomain },
    });

    if (existingTenant) {
      throw new BadRequestException('Subdomain already taken');
    }

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        subdomain: dto.subdomain,
        ownerId,
        subscriptionTier: dto.subscriptionTier || 'TRIAL',
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        settings: {
          theme: {
            primaryColor: '#4F46E5',
            logo: null,
            favicon: null,
          },
          features: {
            tableOrdering: true,
            deliveryOrdering: false,
            takeawayOrdering: true,
            reservations: false,
            inventory: false,
            loyaltyProgram: false,
          },
          limits: {
            maxMenuItems: 50,
            maxTables: 10,
            maxStaff: 5,
            maxOrders: 100,
          },
          business: {
            address: '',
            phone: dto.ownerPhone,
            email: dto.ownerEmail,
            taxId: null,
            currency: 'USD',
            timezone: 'America/New_York',
          },
        },
      },
    });

    // Grant owner admin access
    await this.prisma.tenantAccess.create({
      data: {
        userId: ownerId,
        tenantId: tenant.id,
        role: 'TENANT_ADMIN',
      },
    });

    return tenant as unknown as Tenant;
  }

  async findById(idOrSubdomain: string): Promise<Tenant | null> {
    const resolvedId = await this.resolveTenantId(idOrSubdomain);
    const cacheKey = `tenant:${resolvedId}`;

    // Try cache first (with timeout - avoid hanging on slow Redis)
    const cached = await this.redisGetWithTimeout(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Tenant;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: resolvedId },
    });

    if (tenant) {
      this.redisSetNoWait(cacheKey, JSON.stringify(tenant), 600); // 10 min cache
    }

    return tenant as unknown as Tenant | null;
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });
    return tenant as unknown as Tenant | null;
  }

  async update(id: string, data: any): Promise<Tenant> {
    const resolvedId = await this.resolveTenantId(id);
    const tenant = await this.prisma.tenant.update({
      where: { id: resolvedId },
      data,
    });

    // Invalidate cache
    await this.redis.del(`tenant:${resolvedId}`);

    return tenant as unknown as Tenant;
  }

  private async resolveTenantId(tenantIdOrSubdomainOrSlug: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdOrSubdomainOrSlug);
    if (isUuid) return tenantIdOrSubdomainOrSlug;
    let tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: tenantIdOrSubdomainOrSlug },
    });
    if (!tenant) {
      tenant = await this.prisma.tenant.findUnique({
        where: { menuSlug: tenantIdOrSubdomainOrSlug },
      });
    }
    return tenant?.id ?? tenantIdOrSubdomainOrSlug;
  }

  async getBranding(tenantIdOrSubdomain: string): Promise<{
    primaryColor: string;
    accentColor: string;
    heroGradientStart: string;
    heroGradientMid: string;
    heroGradientEnd: string;
    appName: string;
    heroBackgroundImage: string | null;
  }> {
    const resolvedId = await this.resolveTenantId(tenantIdOrSubdomain);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: resolvedId },
    });
    if (!tenant) {
      return this.getDefaultBranding();
    }
    const settings = tenant.settings as Record<string, unknown>;
    const theme = settings?.theme as Record<string, string> | undefined;
    if (!theme) {
      return this.getDefaultBranding();
    }
    return {
      primaryColor: theme.primaryColor ?? '#ea580c',
      accentColor: theme.accentColor ?? '#e11d48',
      heroGradientStart: theme.heroGradientStart ?? '#f97316',
      heroGradientMid: theme.heroGradientMid ?? '#f59e0b',
      heroGradientEnd: theme.heroGradientEnd ?? '#f43f5e',
      appName: theme.appName ?? 'Digital Order',
      heroBackgroundImage: theme.heroBackgroundImage ?? null,
    };
  }

  private getDefaultBranding() {
    return {
      primaryColor: '#ea580c',
      accentColor: '#e11d48',
      heroGradientStart: '#f97316',
      heroGradientMid: '#f59e0b',
      heroGradientEnd: '#f43f5e',
      appName: 'Digital Order',
      heroBackgroundImage: null,
    };
  }

  async updateBranding(
    tenantIdOrSubdomain: string,
    theme: Partial<{
      primaryColor: string;
      accentColor: string;
      heroGradientStart: string;
      heroGradientMid: string;
      heroGradientEnd: string;
      appName: string;
      heroBackgroundImage: string | null;
      logo: string | null;
      favicon: string | null;
    }>,
  ): Promise<Tenant> {
    const resolvedId = await this.resolveTenantId(tenantIdOrSubdomain);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: resolvedId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    const settings = (tenant.settings as Record<string, unknown>) || {};
    const existingTheme = (settings.theme as Record<string, unknown>) || {};
    const mergedTheme = { ...existingTheme, ...theme };
    const mergedSettings = { ...settings, theme: mergedTheme };

    const updated = await this.prisma.tenant.update({
      where: { id: resolvedId },
      data: { settings: mergedSettings as object },
    });

    await this.redis.del(`tenant:${resolvedId}`);

    return updated as unknown as Tenant;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tenant.delete({
      where: { id },
    });

    await this.redis.del(`tenant:${id}`);
  }

  async listAll(skip: number = 0, take: number = 20) {
    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count(),
    ]);

    return { tenants, total, page: Math.floor(skip / take) + 1, pageSize: take };
  }

  /** Generate a new menu slug for the tenant. Old link stops working. */
  async regenerateMenuSlug(tenantIdOrSubdomain: string, userId: string): Promise<{ menuSlug: string }> {
    const resolvedId = await this.resolveTenantId(tenantIdOrSubdomain);

    const access = await this.prisma.tenantAccess.findUnique({
      where: { userId_tenantId: { userId, tenantId: resolvedId } },
    });
    if (!access || (access.role !== 'TENANT_ADMIN' && access.role !== 'SUPER_ADMIN')) {
      throw new ForbiddenException('You do not have permission to regenerate this tenant\'s menu link');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: resolvedId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    let menuSlug: string;
    do {
      menuSlug = crypto.randomBytes(8).toString('base64url');
    } while (await this.prisma.tenant.findUnique({ where: { menuSlug } }));

    await this.prisma.tenant.update({
      where: { id: resolvedId },
      data: { menuSlug },
    });

    await this.redis.del(`tenant:${resolvedId}`);

    return { menuSlug };
  }
}

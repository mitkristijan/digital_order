import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { extractSubdomain } from '@digital-order/utils';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Try to extract tenant from multiple sources
      let tenantId: string | null = null;

      // 1. From query parameter (for development/testing)
      // Could be either UUID or subdomain
      const queryTenantParam = req.query.tenantId as string;
      console.log('[TenantMiddleware] Query tenantId:', queryTenantParam);

      if (queryTenantParam) {
        // Check if it's a UUID (contains dashes) or subdomain/slug
        if (queryTenantParam.includes('-') && queryTenantParam.length > 30) {
          console.log('[TenantMiddleware] Treating as UUID:', queryTenantParam);
          tenantId = queryTenantParam;
        } else {
          // Treat as subdomain or menuSlug, look up the actual tenant ID
          console.log(
            '[TenantMiddleware] Treating as subdomain/slug, looking up:',
            queryTenantParam
          );
          const tenant = await this.prisma.tenant.findFirst({
            where: {
              OR: [{ subdomain: queryTenantParam }, { menuSlug: queryTenantParam }],
              status: 'ACTIVE',
            },
            select: { id: true, status: true },
          });
          console.log('[TenantMiddleware] Found tenant:', tenant);
          if (tenant && tenant.status === 'ACTIVE') {
            tenantId = tenant.id;
          }
        }
      }

      // 2. From custom header (for mobile apps)
      const headerTenantId = req.headers['x-tenant-id'] as string;
      if (!tenantId && headerTenantId) {
        tenantId = headerTenantId;
      }

      // 3. From subdomain
      if (!tenantId) {
        const subdomain = extractSubdomain(req.hostname);
        if (subdomain) {
          const tenant = await this.prisma.tenant.findUnique({
            where: { subdomain },
            select: { id: true, status: true },
          });
          if (tenant && tenant.status === 'ACTIVE') {
            tenantId = tenant.id;
          }
        }
      }

      // 4. From custom domain
      if (!tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { domain: req.hostname },
          select: { id: true, status: true },
        });
        if (tenant && tenant.status === 'ACTIVE') {
          tenantId = tenant.id;
        }
      }

      console.log('[TenantMiddleware] Final tenantId:', tenantId);

      // Store tenant ID in request for later use
      (req as any).tenantId = tenantId;

      // Also store in global context for Prisma middleware
      (globalThis as any).currentTenantId = tenantId;

      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      next();
    }
  }
}

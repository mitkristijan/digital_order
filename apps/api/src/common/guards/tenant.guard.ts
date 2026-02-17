import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let tenantId = request.tenantId;
    const user = request.user;

    // Super admins can work without a tenantId in their JWT
    // They can specify tenantId via query parameter
    if (user?.role === 'SUPER_ADMIN') {
      if (!tenantId && request.query?.tenantId) {
        tenantId = request.query.tenantId;
      }
      if (tenantId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          tenantId
        );
        if (!isUuid) {
          const tenant = await this.prisma.tenant.findFirst({
            where: { OR: [{ subdomain: tenantId }, { menuSlug: tenantId }], status: 'ACTIVE' },
            select: { id: true },
          });
          if (tenant) {
            request.tenantId = tenant.id;
          }
        }
      }
      return true;
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Resolve subdomain/slug to UUID if needed
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);
    let resolvedTenantId = tenantId;
    if (!isUuid) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { OR: [{ subdomain: tenantId }, { menuSlug: tenantId }], status: 'ACTIVE' },
        select: { id: true },
      });
      if (tenant) {
        resolvedTenantId = tenant.id;
        request.tenantId = tenant.id;
      }
    }

    // Check if user has access to this tenant (JWT tenantId or TenantAccess lookup)
    const userTenantId = user?.tenantId;
    if (userTenantId && userTenantId !== resolvedTenantId) {
      throw new ForbiddenException('Access denied to this tenant');
    }
    if (!userTenantId && user?.userId) {
      const access = await this.prisma.tenantAccess.findFirst({
        where: { userId: user.userId, tenantId: resolvedTenantId },
      });
      if (!access) {
        throw new ForbiddenException('No restaurant associated with your account');
      }
    }

    return true;
  }
}

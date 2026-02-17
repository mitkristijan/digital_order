import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Multi-tenant middleware - automatically filter by tenant
    this.$use(async (params, next) => {
      // Get tenant ID from context (set by TenantMiddleware)
      const tenantId = (globalThis as any).currentTenantId;

      if (tenantId && params.model && this.isMultiTenantModel(params.model)) {
        // Add tenant filter to queries
        if (params.action === 'findMany' || params.action === 'findFirst') {
          params.args.where = {
            ...params.args.where,
            tenantId,
          };
        } else if (params.action === 'count') {
          params.args.where = {
            ...params.args.where,
            tenantId,
          };
        } else if (['create', 'createMany'].includes(params.action)) {
          if (params.action === 'create') {
            params.args.data = {
              ...params.args.data,
              tenantId,
            };
          } else if (params.action === 'createMany') {
            params.args.data = params.args.data.map((item: any) => ({
              ...item,
              tenantId,
            }));
          }
        }
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Prisma 5 doesn't have $on method, use process signals instead
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  private isMultiTenantModel(model: string): boolean {
    const multiTenantModels = [
      'Category',
      'MenuItem',
      'MenuItemVariant',
      'ModifierGroup',
      'Order',
      'Payment',
      'Invoice',
      'Table',
      'Reservation',
      'Staff',
      'InventoryItem',
      'StockMovement',
      'AnalyticsEvent',
    ];
    return multiTenantModels.includes(model);
  }
}

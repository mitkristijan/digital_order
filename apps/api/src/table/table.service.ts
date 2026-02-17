import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class TableService {
  constructor(private prisma: PrismaService) {}

  private async resolveTenantId(tenantIdOrSlug: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      tenantIdOrSlug
    );
    if (isUuid) return tenantIdOrSlug;
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ subdomain: tenantIdOrSlug }, { menuSlug: tenantIdOrSlug }],
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
      select: { id: true },
    });
    if (!tenant) {
      throw new NotFoundException(
        `Tenant not found for "${tenantIdOrSlug}". Ensure the tenant exists with matching subdomain or menu slug.`
      );
    }
    return tenant.id;
  }

  private async getTenantSlugForUrl(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { menuSlug: true, subdomain: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant.menuSlug ?? tenant.subdomain;
  }

  private async generateQrDataUrl(tenantId: string, tableNumber: string): Promise<string> {
    const slug = await this.getTenantSlugForUrl(tenantId);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const qrData = `${baseUrl.replace(/\/$/, '')}/${slug}/${tableNumber}/menu`;
    return QRCode.toDataURL(qrData);
  }

  async createTable(tenantId: string, data: any) {
    // Check if table number already exists
    const existing = await this.prisma.table.findFirst({
      where: { tenantId, tableNumber: data.tableNumber },
    });

    if (existing) {
      throw new BadRequestException('Table number already exists');
    }

    const qrCode = await this.generateQrDataUrl(tenantId, data.tableNumber);

    const table = await this.prisma.table.create({
      data: {
        ...data,
        tenantId,
        qrCode,
        status: 'AVAILABLE',
      },
    });

    return table;
  }

  async getTables(tenantId: string) {
    return this.prisma.table.findMany({
      where: { tenantId },
      orderBy: { tableNumber: 'asc' },
    });
  }

  async getTableById(tenantId: string, id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, tenantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  async updateTable(tenantId: string, id: string, data: any) {
    const table = await this.getTableById(tenantId, id);
    const { qrCode: _qrCode, ...updateData } = data;
    const updated = await this.prisma.table.update({
      where: { id },
      data: updateData,
    });
    // Regenerate QR when table number changes
    if (data.tableNumber && data.tableNumber !== table.tableNumber) {
      const qrCode = await this.generateQrDataUrl(tenantId, data.tableNumber);
      return this.prisma.table.update({
        where: { id },
        data: { qrCode },
      });
    }
    return updated;
  }

  async regenerateQrCode(tenantId: string, tableId: string) {
    const table = await this.getTableById(tenantId, tableId);
    const qrCode = await this.generateQrDataUrl(tenantId, table.tableNumber);
    return this.prisma.table.update({
      where: { id: tableId },
      data: { qrCode },
    });
  }

  async updateTableStatus(tenantId: string, id: string, status: string, orderId?: string) {
    return this.prisma.table.update({
      where: { id },
      data: {
        status: status as any,
        currentOrderId: orderId || null,
      },
    });
  }

  async deleteTable(tenantId: string, id: string) {
    await this.prisma.table.delete({
      where: { id },
    });
  }

  async getTableByNumber(tenantIdOrSlug: string, tableNumber: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSlug);
    const table = await this.prisma.table.findFirst({
      where: { tenantId, tableNumber },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }
}

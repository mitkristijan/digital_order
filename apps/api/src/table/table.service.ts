import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class TableService {
  constructor(private prisma: PrismaService) {}

  async createTable(tenantId: string, data: any) {
    // Check if table number already exists
    const existing = await this.prisma.table.findFirst({
      where: { tenantId, tableNumber: data.tableNumber },
    });

    if (existing) {
      throw new BadRequestException('Table number already exists');
    }

    // Generate QR code data
    const qrData = `${process.env.FRONTEND_URL}/${tenantId}/table/${data.tableNumber}`;
    const qrCode = await QRCode.toDataURL(qrData);

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
    return this.prisma.table.update({
      where: { id },
      data,
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

  async getTableByNumber(tenantId: string, tableNumber: string) {
    const table = await this.prisma.table.findFirst({
      where: { tenantId, tableNumber },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }
}

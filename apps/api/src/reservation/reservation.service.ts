import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationRequest } from '@digital-order/types';

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}

  async createReservation(tenantId: string, dto: CreateReservationRequest, customerId?: string) {
    // Check table availability if table specified
    if (dto.tableId) {
      const table = await this.prisma.table.findFirst({
        where: { id: dto.tableId, tenantId },
      });

      if (!table) {
        throw new NotFoundException('Table not found');
      }

      // Check for existing reservations at this time
      const existingReservation = await this.prisma.reservation.findFirst({
        where: {
          tableId: dto.tableId,
          dateTime: dto.dateTime,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (existingReservation) {
        throw new BadRequestException('Table already reserved at this time');
      }
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        tenantId,
        customerId,
        tableId: dto.tableId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        dateTime: dto.dateTime,
        partySize: dto.partySize,
        specialRequests: dto.specialRequests,
        status: 'PENDING',
      },
      include: {
        table: true,
      },
    });

    // TODO: Send confirmation notification
    return reservation;
  }

  async getReservations(
    tenantId: string,
    status?: string,
    date?: Date,
    skip: number = 0,
    take: number = 20,
  ) {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.dateTime = { gte: startOfDay, lte: endOfDay };
    }

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take,
        orderBy: { dateTime: 'asc' },
        include: {
          table: true,
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return { reservations, total, page: Math.floor(skip / take) + 1, pageSize: take };
  }

  async getReservationById(tenantId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
      include: {
        table: true,
        customer: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async updateReservationStatus(tenantId: string, id: string, status: string) {
    return this.prisma.reservation.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async cancelReservation(tenantId: string, id: string) {
    return this.updateReservationStatus(tenantId, id, 'CANCELLED');
  }

  async confirmReservation(tenantId: string, id: string) {
    return this.updateReservationStatus(tenantId, id, 'CONFIRMED');
  }
}

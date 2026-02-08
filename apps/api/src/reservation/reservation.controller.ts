import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentTenant, CurrentUserId } from '../common/decorators/request.decorators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, CreateReservationRequest } from '@digital-order/types';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new reservation' })
  async createReservation(
    @Query('tenantId') tenantId: string,
    @Body() dto: CreateReservationRequest,
    @CurrentUserId() customerId?: string,
  ) {
    return this.reservationService.createReservation(tenantId, dto, customerId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reservations' })
  async getReservations(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const dateObj = date ? new Date(date) : undefined;
    return this.reservationService.getReservations(tenantId, status, dateObj, skip, take);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reservation by ID' })
  async getReservationById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.reservationService.getReservationById(tenantId, id);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm reservation' })
  async confirmReservation(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.reservationService.confirmReservation(tenantId, id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel reservation' })
  async cancelReservation(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.reservationService.cancelReservation(tenantId, id);
  }
}

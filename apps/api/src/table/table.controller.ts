import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { TableService } from './table.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/request.decorators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@digital-order/types';

@ApiTags('tables')
@Controller('tables')
export class TableController {
  constructor(private tableService: TableService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new table' })
  async createTable(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.tableService.createTable(tenantId, data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tables' })
  async getTables(@CurrentTenant() tenantId: string) {
    return this.tableService.getTables(tenantId);
  }

  @Get('number/:tableNumber')
  @Public()
  @ApiOperation({ summary: 'Get table by number (for QR code scanning)' })
  async getTableByNumber(
    @Query('tenantId') tenantId: string,
    @Param('tableNumber') tableNumber: string
  ) {
    return this.tableService.getTableByNumber(tenantId, tableNumber);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get table by ID' })
  async getTableById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.tableService.getTableById(tenantId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update table' })
  async updateTable(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.tableService.updateTable(tenantId, id, data);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update table status' })
  async updateTableStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() data: { status: string; orderId?: string }
  ) {
    return this.tableService.updateTableStatus(tenantId, id, data.status, data.orderId);
  }

  @Patch(':id/regenerate-qr')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate QR code for table' })
  async regenerateQrCode(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.tableService.regenerateQrCode(tenantId, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete table' })
  async deleteTable(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.tableService.deleteTable(tenantId, id);
    return { success: true };
  }
}

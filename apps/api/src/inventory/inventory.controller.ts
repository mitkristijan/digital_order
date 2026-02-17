import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/request.decorators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@digital-order/types';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // ========== INVENTORY ITEMS ==========

  @Post('items')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Create inventory item' })
  async createInventoryItem(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.inventoryService.createInventoryItem(tenantId, data);
  }

  @Get('items')
  @Roles(UserRole.TENANT_ADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get all inventory items' })
  async getInventoryItems(
    @CurrentTenant() tenantId: string,
    @Query('lowStockOnly') lowStockOnly?: boolean
  ) {
    return this.inventoryService.getInventoryItems(tenantId, lowStockOnly);
  }

  @Get('items/:id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get inventory item by ID' })
  async getInventoryItemById(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.inventoryService.getInventoryItemById(tenantId, id);
  }

  @Put('items/:id')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update inventory item' })
  async updateInventoryItem(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() data: any
  ) {
    return this.inventoryService.updateInventoryItem(tenantId, id, data);
  }

  @Delete('items/:id')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Delete inventory item' })
  async deleteInventoryItem(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.inventoryService.deleteInventoryItem(tenantId, id);
    return { success: true };
  }

  // ========== STOCK MOVEMENTS ==========

  @Post('movements')
  @Roles(UserRole.TENANT_ADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Record stock movement' })
  async recordStockMovement(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.inventoryService.recordStockMovement(tenantId, data);
  }

  @Get('movements')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get stock movement history' })
  async getStockMovements(
    @CurrentTenant() tenantId: string,
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number
  ) {
    return this.inventoryService.getStockMovements(tenantId, inventoryItemId, skip, take);
  }

  // ========== RECIPE COSTING ==========

  @Post('recipe-items')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Add ingredient to menu item recipe' })
  async createRecipeItem(@Body() data: any) {
    return this.inventoryService.createRecipeItem(data.menuItemId, data);
  }

  @Get('recipe-items/:menuItemId')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get recipe items for menu item' })
  async getRecipeItems(@Param('menuItemId') menuItemId: string) {
    return this.inventoryService.getRecipeItems(menuItemId);
  }

  @Get('cost/:menuItemId')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Calculate cost of menu item' })
  async calculateMenuItemCost(@Param('menuItemId') menuItemId: string) {
    return this.inventoryService.calculateMenuItemCost(menuItemId);
  }

  @Get('alerts/low-stock')
  @Roles(UserRole.TENANT_ADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get low stock alerts' })
  async getLowStockAlerts(@CurrentTenant() tenantId: string) {
    return this.inventoryService.getLowStockAlerts(tenantId);
  }
}

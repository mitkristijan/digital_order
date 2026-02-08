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
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/request.decorators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@digital-order/types';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  // ========== CATEGORIES ==========

  @Post('categories')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category' })
  async createCategory(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.menuService.createCategory(tenantId, data);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get all categories with menu items' })
  async getCategories(@Query('tenantId') tenantId: string) {
    return this.menuService.getCategories(tenantId);
  }

  @Get('categories/:id')
  @Public()
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategoryById(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.menuService.getCategoryById(tenantId, id);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.menuService.updateCategory(tenantId, id, data);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.menuService.deleteCategory(tenantId, id);
    return { success: true };
  }

  // ========== MENU ITEMS ==========

  @Post('items')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new menu item' })
  async createMenuItem(
    @CurrentTenant() tenantId: string,
    @Query('tenantId') queryTenantId: string,
    @Body() data: any,
  ) {
    // Use query tenantId if currentTenant is null (for SUPER_ADMIN)
    const effectiveTenantId = tenantId || queryTenantId;
    return this.menuService.createMenuItem(effectiveTenantId, data);
  }

  @Get('items')
  @Public()
  @ApiOperation({ summary: 'Get all menu items' })
  async getMenuItems(
    @Query('tenantId') tenantId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.menuService.getMenuItems(tenantId, categoryId);
  }

  @Get('items/:id')
  @Public()
  @ApiOperation({ summary: 'Get menu item by ID with full details' })
  async getMenuItemById(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.menuService.getMenuItemById(tenantId, id);
  }

  @Put('items/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update menu item' })
  async updateMenuItem(
    @CurrentTenant() tenantId: string,
    @Query('tenantId') queryTenantId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const effectiveTenantId = tenantId || queryTenantId;
    return this.menuService.updateMenuItem(effectiveTenantId, id, data);
  }

  @Patch('items/:id/availability')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.KITCHEN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle menu item availability' })
  async toggleAvailability(
    @CurrentTenant() tenantId: string,
    @Query('tenantId') queryTenantId: string,
    @Param('id') id: string,
    @Body('availability') availability: boolean,
  ) {
    const effectiveTenantId = tenantId || queryTenantId;
    return this.menuService.toggleMenuItemAvailability(effectiveTenantId, id, availability);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete menu item' })
  async deleteMenuItem(
    @CurrentTenant() tenantId: string,
    @Query('tenantId') queryTenantId: string,
    @Param('id') id: string,
  ) {
    const effectiveTenantId = tenantId || queryTenantId;
    await this.menuService.deleteMenuItem(effectiveTenantId, id);
    return { success: true };
  }

  // ========== MODIFIERS ==========

  @Post('modifier-groups')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create modifier group with modifiers' })
  async createModifierGroup(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.menuService.createModifierGroup(tenantId, data);
  }

  @Get('modifier-groups')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all modifier groups' })
  async getModifierGroups(@CurrentTenant() tenantId: string) {
    return this.menuService.getModifierGroups(tenantId);
  }

  @Post('items/:itemId/modifier-groups/:groupId')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach modifier group to menu item' })
  async attachModifierGroup(@Param('itemId') itemId: string, @Param('groupId') groupId: string) {
    return this.menuService.attachModifierGroupToMenuItem(itemId, groupId);
  }

  // ========== FULL MENU ==========

  @Get('full')
  @Public()
  @ApiOperation({ summary: 'Get complete menu with categories, items, variants, and modifiers' })
  async getFullMenu(@Query('tenantId') tenantId: string) {
    return this.menuService.getFullMenu(tenantId);
  }
}

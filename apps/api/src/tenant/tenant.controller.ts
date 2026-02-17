import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUserId } from '../common/decorators/request.decorators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, CreateTenantRequest } from '@digital-order/types';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new tenant' })
  async create(@Body() dto: CreateTenantRequest, @CurrentUserId() userId: string) {
    return this.tenantService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all tenants (Super Admin only)' })
  async list(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.tenantService.listAll(skip, take);
  }

  @Patch(':id/regenerate-menu-slug')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Regenerate customer menu link (old link stops working)' })
  async regenerateMenuSlug(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.tenantService.regenerateMenuSlug(id, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async getById(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update tenant' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.tenantService.update(id, data);
  }

  @Patch(':id/branding')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update tenant branding (customer UI)' })
  async updateBranding(
    @Param('id') id: string,
    @Body()
    body: {
      primaryColor?: string;
      accentColor?: string;
      heroGradientStart?: string;
      heroGradientMid?: string;
      heroGradientEnd?: string;
      appName?: string;
      heroBackgroundImage?: string | null;
    }
  ) {
    return this.tenantService.updateBranding(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete tenant (Super Admin only)' })
  async delete(@Param('id') id: string) {
    return this.tenantService.delete(id);
  }
}

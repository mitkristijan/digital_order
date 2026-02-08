import { Controller, Get, Param } from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';
import { Public } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('branding')
@Controller('public/branding')
export class BrandingController {
  constructor(private tenantService: TenantService) {}

  @Get(':tenantId')
  @Public()
  @ApiOperation({ summary: 'Get customer UI branding (public)' })
  async getBranding(@Param('tenantId') tenantId: string) {
    return this.tenantService.getBranding(tenantId);
  }
}

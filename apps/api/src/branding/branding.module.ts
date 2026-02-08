import { Module } from '@nestjs/common';
import { BrandingController } from './branding.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [BrandingController],
})
export class BrandingModule {}

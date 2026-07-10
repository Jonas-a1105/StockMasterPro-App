import { Module } from '@nestjs/common';
import { TenantSettingsController } from './http/tenant-settings.controller';
import { TenantSettingsService } from '../application/tenant-settings.service';

@Module({
  controllers: [TenantSettingsController],
  providers: [TenantSettingsService],
  exports: [TenantSettingsService],
})
export class TenantSettingsModule {}

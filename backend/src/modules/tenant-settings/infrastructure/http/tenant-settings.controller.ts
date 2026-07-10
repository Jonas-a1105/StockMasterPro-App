import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { TenantSettingsService } from '../../application/tenant-settings.service';
import { UpdateTenantSettingsDto } from '../dto/update-tenant-settings.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';

@Controller('tenant-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'gerente')
export class TenantSettingsController {
  constructor(private readonly service: TenantSettingsService) {}

  @Get()
  async find(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findByTenant(user.tenantId);
  }

  @Patch()
  async update(
    @Body() dto: UpdateTenantSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(user.tenantId, dto);
  }
}

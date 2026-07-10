import { Controller, Get, Post, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '@shared/infrastructure/guards/platform-admin.guard';
import { AuthPrismaService } from '@shared/infrastructure/prisma/auth-prisma.service';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminTenantController {
  constructor(
    private readonly prisma: AuthPrismaService,
  ) {}

  @Get()
  async findAll() {
    const rows = await this.prisma.tenant.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      planType: r.planType,
      subscriptionStatus: r.subscriptionStatus,
      licenseExpiresAt: r.licenseExpiresAt,
      isBlocked: r.isBlocked,
      createdAt: r.createdAt,
    }));
  }

  @Post(':id/block')
  async block(@Param('id') id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    await this.prisma.tenant.update({
      where: { id },
      data: { isBlocked: true },
    });
    return { message: 'Tenant bloqueado correctamente' };
  }

  @Post(':id/unblock')
  async unblock(@Param('id') id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    await this.prisma.tenant.update({
      where: { id },
      data: { isBlocked: false, subscriptionStatus: 'active' },
    });
    return { message: 'Tenant desbloqueado correctamente' };
  }

  @Post(':id/extend')
  async extend(@Param('id') id: string, @Body() body: { days: number }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const currentExpiry = tenant.licenseExpiresAt;
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate.getTime() + body.days * 86400000);

    await this.prisma.tenant.update({
      where: { id },
      data: {
        licenseExpiresAt: newExpiry,
        isBlocked: false,
      },
    });
    return {
      message: `Licencia extendida ${body.days} días`,
      expiresAt: newExpiry,
    };
  }

  @Post(':id/plan')
  async changePlan(
    @Param('id') id: string,
    @Body() body: { planType: string },
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    await this.prisma.tenant.update({
      where: { id },
      data: { planType: body.planType },
    });
    return { message: `Plan cambiado a ${body.planType}` };
  }
}

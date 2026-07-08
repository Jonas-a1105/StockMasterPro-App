import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { PostgresReportRepo } from '../persistence/PostgresReportRepo';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly repo: PostgresReportRepo) {}

  @Get('net-profit')
  @Roles('admin', 'gerente')
  getNetProfit(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.repo.getNetProfit(user.tenantId, startDate, endDate);
  }

  @Get('best-sellers')
  @Roles('admin', 'gerente')
  getBestSellers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.repo.getBestSellers(user.tenantId, limit ? parseInt(limit) : 10, startDate, endDate);
  }

  @Get('dead-products')
  @Roles('admin', 'gerente')
  getDeadProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('days') days?: string,
  ) {
    return this.repo.getDeadProducts(user.tenantId, days ? parseInt(days) : 90);
  }

  @Get('monthly-profit')
  @Roles('admin', 'gerente')
  getMonthlyProfit(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    return this.repo.getMonthlyProfit(user.tenantId, year ? parseInt(year) : new Date().getFullYear());
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PostgresReportRepo } from './PostgresReportRepo';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly repo: PostgresReportRepo) {}

  @Get('net-profit')
  @Roles('admin', 'gerente')
  getNetProfit(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.repo.getNetProfit(user.tenantId, startDate, endDate);
  }

  @Get('best-sellers')
  @Roles('admin', 'gerente')
  getBestSellers(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.repo.getBestSellers(user.tenantId, limit ? parseInt(limit) : 10, startDate, endDate);
  }

  @Get('dead-products')
  @Roles('admin', 'gerente')
  getDeadProducts(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    return this.repo.getDeadProducts(user.tenantId, days ? parseInt(days) : 90);
  }

  @Get('monthly-profit')
  @Roles('admin', 'gerente')
  getMonthlyProfit(
    @CurrentUser() user: any,
    @Query('year') year?: string,
  ) {
    return this.repo.getMonthlyProfit(user.tenantId, year ? parseInt(year) : new Date().getFullYear());
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { SaasMetricsService } from '../../application/saas-metrics.service';
import { MRRMetrics, ChurnMetrics, LTVMetrics, CohortMetrics } from '../../application/saas-metrics.service';

@ApiTags('SaaS Metrics')
@ApiBearerAuth()
@Controller('saas-metrics')
export class SaasMetricsController {
  constructor(private readonly metricsService: SaasMetricsService) {}

  @Get('mrr')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Obtener métricas de MRR' })
  async getMRR(): Promise<MRRMetrics> {
    return this.metricsService.getMRRMetrics();
  }

  @Get('churn')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Obtener métricas de churn' })
  async getChurn(): Promise<ChurnMetrics> {
    return this.metricsService.getChurnMetrics();
  }

  @Get('ltv')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Obtener métricas de LTV' })
  async getLTV(): Promise<LTVMetrics> {
    return this.metricsService.getLTVMetrics();
  }

  @Get('cohorts')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Obtener análisis de cohortes' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Meses de historial (default 12)' })
  async getCohorts(@Query('months') months?: number): Promise<CohortMetrics[]> {
    return this.metricsService.getCohortMetrics(months ?? 12);
  }

  @Get('summary')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Resumen completo de métricas SaaS' })
  async getSummary(): Promise<{
    mrr: any;
    churn: any;
    ltv: any;
    cohorts: any[];
  }> {
    return this.metricsService.getFullMetrics();
  }
}
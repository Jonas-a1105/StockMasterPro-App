import { Module } from '@nestjs/common';
import { SaasMetricsController } from './http/saas-metrics.controller';
import { SaasMetricsService } from '../application/saas-metrics.service';

@Module({
  controllers: [SaasMetricsController],
  providers: [SaasMetricsService],
  exports: [SaasMetricsService],
})
export class SaasMetricsModule {}
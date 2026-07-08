import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { PostgresReportRepo } from './PostgresReportRepo';

@Module({
  controllers: [ReportController],
  providers: [PostgresReportRepo],
  exports: [PostgresReportRepo],
})
export class ReportModule {}

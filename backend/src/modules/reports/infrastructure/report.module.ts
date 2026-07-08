import { Module } from '@nestjs/common';
import { ReportController } from './http/report.controller';
import { PostgresReportRepo } from './persistence/PostgresReportRepo';

@Module({
  controllers: [ReportController],
  providers: [PostgresReportRepo],
  exports: [PostgresReportRepo],
})
export class ReportModule {}

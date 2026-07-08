import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PostgresSaleRepo } from './PostgresSaleRepo';
import { PostgresProductRepo } from '../../inventory/infrastructure/PostgresProductRepo';

@Module({
  controllers: [SalesController],
  providers: [SalesService, PostgresSaleRepo, PostgresProductRepo],
})
export class SalesModule {}

import { Module } from '@nestjs/common';
import { WarehouseController } from './warehouse.controller';
import { PostgresWarehouseRepo } from './PostgresWarehouseRepo';

@Module({
  controllers: [WarehouseController],
  providers: [PostgresWarehouseRepo],
  exports: [PostgresWarehouseRepo],
})
export class WarehouseModule {}

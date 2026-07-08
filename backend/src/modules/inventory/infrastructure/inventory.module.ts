import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PostgresProductRepo } from './PostgresProductRepo';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PostgresProductRepo],
  exports: [PostgresProductRepo],
})
export class InventoryModule {}

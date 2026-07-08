import { Module } from '@nestjs/common';
import { InventoryController } from './http/inventory.controller';
import { InventoryService } from './inventory.service';
import { PostgresProductRepo } from './persistence/PostgresProductRepo';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: 'ProductRepository',
      useClass: PostgresProductRepo,
    },
  ],
  exports: ['ProductRepository'],
})
export class InventoryModule {}

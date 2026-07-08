import { Module } from '@nestjs/common';
import { SalesController } from './http/sales.controller';
import { SalesService } from './sales.service';
import { PostgresSaleRepo } from './persistence/PostgresSaleRepo';
import { InventoryModule } from '../../inventory/infrastructure/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    {
      provide: 'SaleRepository',
      useClass: PostgresSaleRepo,
    },
  ],
})
export class SalesModule {}

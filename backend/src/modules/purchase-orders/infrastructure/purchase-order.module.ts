import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './http/purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { PostgresPurchaseOrderRepo } from './persistence/PostgresPurchaseOrderRepo';

@Module({
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService, PostgresPurchaseOrderRepo],
  exports: [PostgresPurchaseOrderRepo],
})
export class PurchaseOrdersModule {}

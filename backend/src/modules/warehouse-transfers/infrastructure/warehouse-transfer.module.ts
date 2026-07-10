import { Module } from '@nestjs/common';
import { WarehouseTransferController } from './http/warehouse-transfer.controller';
import { WarehouseTransferService } from '../application/warehouse-transfer.service';

@Module({
  controllers: [WarehouseTransferController],
  providers: [WarehouseTransferService],
  exports: [WarehouseTransferService],
})
export class WarehouseTransferModule {}

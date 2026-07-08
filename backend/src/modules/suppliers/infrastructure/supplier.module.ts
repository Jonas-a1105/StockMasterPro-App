import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { PostgresSupplierRepo } from './PostgresSupplierRepo';

@Module({
  controllers: [SupplierController],
  providers: [SupplierService, PostgresSupplierRepo],
  exports: [PostgresSupplierRepo],
})
export class SuppliersModule {}

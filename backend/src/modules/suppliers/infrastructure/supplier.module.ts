import { Module } from '@nestjs/common';
import { SupplierController } from './http/supplier.controller';
import { SupplierService } from './supplier.service';

@Module({
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SuppliersModule {}

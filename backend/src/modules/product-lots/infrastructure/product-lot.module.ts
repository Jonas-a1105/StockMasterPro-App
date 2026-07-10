import { Module } from '@nestjs/common';
import { ProductLotController } from './http/product-lot.controller';
import { ProductLotService } from '../application/product-lot.service';

@Module({
  controllers: [ProductLotController],
  providers: [ProductLotService],
  exports: [ProductLotService],
})
export class ProductLotModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { SalesController } from './http/sales.controller';
import { PostgresSaleRepo } from './persistence/PostgresSaleRepo';
import { SALES_REPOSITORY } from '../application/ports/SaleRepository.interface';
import { InventoryModule } from '../../inventory/infrastructure/inventory.module';
import { ProcessSaleUseCase } from '../application/use-cases/ProcessSale';
import { ProcessBulkSalesUseCase } from '../application/use-cases/ProcessBulkSales';
import { FindAllSalesUseCase } from '../application/use-cases/FindAllSales';
import { FindSaleByIdUseCase } from '../application/use-cases/FindSaleById';
import { GetDailySalesSummaryUseCase } from '../application/use-cases/GetDailySalesSummary';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [SalesController],
  providers: [
    { provide: SALES_REPOSITORY, useClass: PostgresSaleRepo },
    ProcessSaleUseCase,
    ProcessBulkSalesUseCase,
    FindAllSalesUseCase,
    FindSaleByIdUseCase,
    GetDailySalesSummaryUseCase,
  ],
})
export class SalesModule {}

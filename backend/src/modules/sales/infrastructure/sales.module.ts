import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { SalesController } from './http/sales.controller';
import { PostgresSaleRepo } from './persistence/postgres-sale.repository';
import { SALES_REPOSITORY } from '../application/ports/sale.repository.interface';
import { InventoryModule } from '../../inventory';
import { AccountsReceivableModule } from '../../accounts-receivable';
import { CashRegisterModule } from '../../cash-register';
import { ProcessSaleUseCase } from '../application/use-cases/process-sale.use-case';
import { ProcessBulkSalesUseCase } from '../application/use-cases/process-bulk-sales.use-case';
import { FindAllSalesUseCase } from '../application/use-cases/find-all-sales.use-case';
import { FindSaleByIdUseCase } from '../application/use-cases/find-sale-by-id.use-case';
import { GetDailySalesSummaryUseCase } from '../application/use-cases/get-daily-sales-summary.use-case';

@Module({
  imports: [PrismaModule, InventoryModule, AccountsReceivableModule, CashRegisterModule],
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

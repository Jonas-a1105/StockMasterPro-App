import { Module } from '@nestjs/common';
import { FiscalController } from './infrastructure/http/fiscal.controller';
import { InvoiceSequenceService } from './application/invoice-sequence.service';
import { TaxWithholdingService } from './application/tax-withholding.service';

@Module({
  controllers: [FiscalController],
  providers: [InvoiceSequenceService, TaxWithholdingService],
  exports: [InvoiceSequenceService, TaxWithholdingService],
})
export class FiscalModule {}

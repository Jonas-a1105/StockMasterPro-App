import { Module } from '@nestjs/common';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountsPayableService } from './accounts-payable.service';
import { PostgresAccountsPayableRepo } from './PostgresAccountsPayableRepo';

@Module({
  controllers: [AccountsPayableController],
  providers: [AccountsPayableService, PostgresAccountsPayableRepo],
  exports: [AccountsPayableService],
})
export class AccountsPayableModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { AccountsReceivableController } from './http/accounts-receivable.controller';
import { ACCOUNTS_RECEIVABLE_REPOSITORY } from '../application/ports/accounts-receivable.repository.interface';
import { PostgresAccountsReceivableRepo } from './persistence/postgres-accounts-receivable.repository';
import { CreateAccountsReceivableUseCase } from '../application/use-cases/create-accounts-receivable.use-case';
import { ListAccountsReceivableUseCase } from '../application/use-cases/list-accounts-receivable.use-case';
import { FindAccountsReceivableByIdUseCase } from '../application/use-cases/find-accounts-receivable-by-id.use-case';
import { ListByCustomerUseCase } from '../application/use-cases/list-by-customer.use-case';
import { PayAccountsReceivableUseCase } from '../application/use-cases/pay-accounts-receivable.use-case';
import { GetReceivablePaymentsUseCase } from '../application/use-cases/get-receivable-payments.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [AccountsReceivableController],
  providers: [
    {
      provide: ACCOUNTS_RECEIVABLE_REPOSITORY,
      useClass: PostgresAccountsReceivableRepo,
    },
    CreateAccountsReceivableUseCase,
    ListAccountsReceivableUseCase,
    FindAccountsReceivableByIdUseCase,
    ListByCustomerUseCase,
    PayAccountsReceivableUseCase,
    GetReceivablePaymentsUseCase,
  ],
  exports: [ACCOUNTS_RECEIVABLE_REPOSITORY],
})
export class AccountsReceivableModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { AccountsPayableController } from './http/accounts-payable.controller';
import { ACCOUNTS_PAYABLE_REPOSITORY } from '../application/ports/accounts-payable.repository.interface';
import { PostgresAccountsPayableRepo } from './persistence/postgres-accounts-payable.repository';
import { CreateAccountsPayableUseCase } from '../application/use-cases/create-accounts-payable.use-case';
import { PayAccountsPayableUseCase } from '../application/use-cases/pay-accounts-payable.use-case';
import { ListAccountsPayableUseCase } from '../application/use-cases/list-accounts-payable.use-case';
import { FindAccountsPayableByIdUseCase } from '../application/use-cases/find-accounts-payable-by-id.use-case';
import { GetPayablePaymentsUseCase } from '../application/use-cases/get-payable-payments.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [AccountsPayableController],
  providers: [
    { provide: ACCOUNTS_PAYABLE_REPOSITORY, useClass: PostgresAccountsPayableRepo },
    CreateAccountsPayableUseCase,
    PayAccountsPayableUseCase,
    ListAccountsPayableUseCase,
    FindAccountsPayableByIdUseCase,
    GetPayablePaymentsUseCase,
  ],
})
export class AccountsPayableModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { AccountsPayableController } from './http/accounts-payable.controller';
import { ACCOUNTS_PAYABLE_REPOSITORY } from '../application/ports/AccountsPayableRepository.interface';
import { PostgresAccountsPayableRepo } from './persistence/PostgresAccountsPayableRepo';
import { CreateAccountsPayableUseCase } from '../application/use-cases/CreateAccountsPayable';
import { PayAccountsPayableUseCase } from '../application/use-cases/PayAccountsPayable';
import { ListAccountsPayableUseCase } from '../application/use-cases/ListAccountsPayable';
import { FindAccountsPayableByIdUseCase } from '../application/use-cases/FindAccountsPayableById';
import { GetPayablePaymentsUseCase } from '../application/use-cases/GetPayablePayments';

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

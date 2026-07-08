import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { CashRegisterController } from './http/cash-register.controller';
import { CASH_REGISTER_REPOSITORY } from '../application/ports/cash-register.repository.interface';
import { PostgresCashRegisterRepo } from './persistence/postgres-cash-register.repository';
import { OpenCashSessionUseCase } from '../application/use-cases/open-cash-session.use-case';
import { CloseCashSessionUseCase } from '../application/use-cases/close-cash-session.use-case';
import { AddCashTransactionUseCase } from '../application/use-cases/add-cash-transaction.use-case';
import { GetCashSessionUseCase } from '../application/use-cases/get-cash-session.use-case';
import { ListCashSessionsUseCase } from '../application/use-cases/list-cash-sessions.use-case';
import { GetSessionTransactionsUseCase } from '../application/use-cases/get-session-transactions.use-case';
import { GetCurrentSessionUseCase } from '../application/use-cases/get-current-session.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [CashRegisterController],
  providers: [
    { provide: CASH_REGISTER_REPOSITORY, useClass: PostgresCashRegisterRepo },
    OpenCashSessionUseCase,
    CloseCashSessionUseCase,
    AddCashTransactionUseCase,
    GetCashSessionUseCase,
    ListCashSessionsUseCase,
    GetSessionTransactionsUseCase,
    GetCurrentSessionUseCase,
  ],
  exports: [CASH_REGISTER_REPOSITORY],
})
export class CashRegisterModule {}

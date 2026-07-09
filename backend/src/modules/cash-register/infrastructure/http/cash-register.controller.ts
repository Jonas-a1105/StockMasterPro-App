import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { OpenSessionDto } from '../../application/dtos/open-session.dto';
import { CloseSessionDto } from '../../application/dtos/close-session.dto';
import { CreateTransactionDto } from '../../application/dtos/create-transaction.dto';
import { OpenCashSessionUseCase } from '../../application/use-cases/open-cash-session.use-case';
import { CloseCashSessionUseCase } from '../../application/use-cases/close-cash-session.use-case';
import { AddCashTransactionUseCase } from '../../application/use-cases/add-cash-transaction.use-case';
import { GetCashSessionUseCase } from '../../application/use-cases/get-cash-session.use-case';
import { ListCashSessionsUseCase } from '../../application/use-cases/list-cash-sessions.use-case';
import { GetSessionTransactionsUseCase } from '../../application/use-cases/get-session-transactions.use-case';
import { GetCurrentSessionUseCase } from '../../application/use-cases/get-current-session.use-case';

@Controller('cash-register')
export class CashRegisterController {
  constructor(
    private readonly openSessionUseCase: OpenCashSessionUseCase,
    private readonly closeSessionUseCase: CloseCashSessionUseCase,
    private readonly addTransactionUseCase: AddCashTransactionUseCase,
    private readonly getSessionUseCase: GetCashSessionUseCase,
    private readonly listSessionsUseCase: ListCashSessionsUseCase,
    private readonly getTransactionsUseCase: GetSessionTransactionsUseCase,
    private readonly getCurrentSessionUseCase: GetCurrentSessionUseCase,
  ) {}

  @Post('open')
  async openSession(
    @Body() dto: OpenSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.openSessionUseCase.execute({
      tenantId: user.tenantId,
      userId: user.id,
      openingBalance: dto.openingBalance,
      notes: dto.notes,
    });
  }

  @Post(':id/close')
  async closeSession(
    @Param('id') id: string,
    @Body() dto: CloseSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.closeSessionUseCase.execute(
      id,
      user.tenantId,
      dto.actualBalance,
    );
  }

  @Post(':id/transaction')
  async addTransaction(
    @Param('id') id: string,
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.addTransactionUseCase.execute({
      tenantId: user.tenantId,
      sessionId: id,
      amount: dto.amount,
      type: dto.type,
      description: dto.description,
    });
  }

  @Get('current')
  async getCurrentSession(@CurrentUser() user: AuthenticatedUser) {
    return this.getCurrentSessionUseCase.execute(user.id, user.tenantId);
  }

  @Get()
  async listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.listSessionsUseCase.execute(user.tenantId);
  }

  @Get(':id')
  async getSession(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getSessionUseCase.execute(id, user.tenantId);
  }

  @Get(':id/transactions')
  async getTransactions(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getTransactionsUseCase.execute(id, user.tenantId);
  }
}

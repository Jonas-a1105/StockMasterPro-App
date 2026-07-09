import { Inject, Injectable } from '@nestjs/common';
import {
  CashRegisterRepository,
  CASH_REGISTER_REPOSITORY,
} from '../ports/cash-register.repository.interface';
import { CashTransaction } from '../../domain/cash-transaction.entity';

@Injectable()
export class GetSessionTransactionsUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly repo: CashRegisterRepository,
  ) {}

  async execute(
    sessionId: string,
    tenantId: string,
  ): Promise<CashTransaction[]> {
    return this.repo.getTransactions(sessionId, tenantId);
  }
}

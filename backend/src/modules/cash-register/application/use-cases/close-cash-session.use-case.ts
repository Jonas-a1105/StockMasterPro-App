import { Inject, Injectable } from '@nestjs/common';
import {
  CashRegisterRepository,
  CASH_REGISTER_REPOSITORY,
} from '../ports/cash-register.repository.interface';
import { SessionNotFoundException } from '../../domain/cash-register.errors';

@Injectable()
export class CloseCashSessionUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly repo: CashRegisterRepository,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    actualBalance: number,
  ): Promise<{
    closingBalance: number;
    actualBalance: number;
    difference: number;
  }> {
    const session = await this.repo.findById(id, tenantId);
    if (!session) throw new SessionNotFoundException();

    const transactionSum = await this.repo.sumTransactions(id, tenantId);

    // Domain entity validates open state and computes close values
    const closeData = session.close(actualBalance, transactionSum);

    await this.repo.closeSession(
      id,
      tenantId,
      closeData.closingBalance,
      closeData.actualBalance,
      closeData.difference,
    );

    return closeData;
  }
}

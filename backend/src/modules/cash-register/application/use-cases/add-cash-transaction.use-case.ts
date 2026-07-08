import { Inject, Injectable } from '@nestjs/common';
import {
  CashRegisterRepository,
  CASH_REGISTER_REPOSITORY,
  CreateTransactionData,
} from '../ports/cash-register.repository.interface';
import { CashTransaction } from '../../domain/cash-transaction.entity';
import { SessionNotFoundException, InvalidTransactionTypeException } from '../../domain/cash-register.errors';

const VALID_TYPES = ['income', 'expense', 'sale', 'refund'] as const;

@Injectable()
export class AddCashTransactionUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly repo: CashRegisterRepository,
  ) {}

  async execute(data: CreateTransactionData): Promise<CashTransaction> {
    if (!VALID_TYPES.includes(data.type)) {
      throw new InvalidTransactionTypeException(data.type);
    }

    const session = await this.repo.findById(data.sessionId, data.tenantId);
    if (!session) throw new SessionNotFoundException();

    // Domain entity validates the session is open
    session.validateOpen();

    return this.repo.addTransaction(data);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  AccountsReceivableRepository,
  ACCOUNTS_RECEIVABLE_REPOSITORY,
  ReceivablePaymentData,
} from '../ports/accounts-receivable.repository.interface';
import { ReceivablePayment } from '../../domain/receivable-payment.entity';
import { ReceivableNotFoundException } from '../../domain/accounts-receivable.errors';

@Injectable()
export class PayAccountsReceivableUseCase {
  constructor(
    @Inject(ACCOUNTS_RECEIVABLE_REPOSITORY)
    private readonly repo: AccountsReceivableRepository,
  ) {}

  async execute(data: ReceivablePaymentData): Promise<ReceivablePayment> {
    const receivable = await this.repo.findById(data.accountReceivableId, data.tenantId);
    if (!receivable) throw new ReceivableNotFoundException();

    // Domain entity validates invariants and computes new state
    const { newPendingAmount, newStatus } = receivable.applyPayment(data.amount);

    const payment = await this.repo.addPayment(data);
    await this.repo.updateStatus(data.accountReceivableId, data.tenantId, newPendingAmount, newStatus);

    return payment;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { AccountsPayableRepository, PayablePaymentData, ACCOUNTS_PAYABLE_REPOSITORY } from '../ports/accounts-payable.repository.interface';
import { PayablePayment } from '../../domain/payable-payment.entity';

import { PayableNotFoundException } from '../../domain/accounts-payable.errors';

@Injectable()
export class PayAccountsPayableUseCase {
  constructor(
    @Inject(ACCOUNTS_PAYABLE_REPOSITORY)
    private readonly repo: AccountsPayableRepository,
  ) {}

  async execute(data: PayablePaymentData): Promise<PayablePayment> {
    const payable = await this.repo.findById(data.accountPayableId, data.tenantId);
    if (!payable) throw new PayableNotFoundException();

    const newPending = payable.applyPayment(data.amount);

    const payment = await this.repo.addPayment(data);
    await this.repo.updatePendingAmount(data.accountPayableId, data.tenantId, newPending);
    if (newPending <= 0) {
      await this.repo.markAsPaid(data.accountPayableId, data.tenantId);
    }
    return payment;
  }
}

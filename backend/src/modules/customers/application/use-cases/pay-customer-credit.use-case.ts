import { Inject, Injectable } from '@nestjs/common';
import {
  CustomerRepository,
  CUSTOMER_REPOSITORY,
} from '../ports/customer.repository.interface';
import {
  AccountsReceivableRepository,
  ACCOUNTS_RECEIVABLE_REPOSITORY,
} from '@modules/accounts-receivable';
import { Customer } from '../../domain/customer.entity';
import { FindCustomerByIdUseCase } from './find-customer-by-id.use-case';

@Injectable()
export class PayCustomerCreditUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repo: CustomerRepository,
    @Inject(ACCOUNTS_RECEIVABLE_REPOSITORY)
    private readonly receivableRepo: AccountsReceivableRepository,
    private readonly findCustomerById: FindCustomerByIdUseCase,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    amount: number,
  ): Promise<Customer> {
    const customer = await this.findCustomerById.execute(id, tenantId);
    const newBalance = customer.payCredit(amount);

    // Apply payment to oldest pending receivable first (FIFO)
    const receivables = await this.receivableRepo.findByCustomer(id, tenantId);
    const pending = receivables
      .filter((r) => r.pendingAmount > 0)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    let remaining = amount;
    for (const receivable of pending) {
      if (remaining <= 0) break;
      const paymentAmount = Math.min(remaining, receivable.pendingAmount);
      const { newPendingAmount, newStatus } =
        receivable.applyPayment(paymentAmount);
      await this.receivableRepo.addPayment({
        tenantId,
        accountReceivableId: receivable.id,
        amount: paymentAmount,
        paymentMethod: 'cash',
        paidAt: new Date().toISOString(),
      });
      await this.receivableRepo.updateStatus(
        receivable.id,
        tenantId,
        newPendingAmount,
        newStatus,
      );
      remaining -= paymentAmount;
    }

    return this.repo.update(id, tenantId, { balance: newBalance });
  }
}

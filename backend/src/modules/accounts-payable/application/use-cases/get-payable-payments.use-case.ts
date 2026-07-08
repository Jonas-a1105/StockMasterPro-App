import { Inject, Injectable } from '@nestjs/common';
import { AccountsPayableRepository, ACCOUNTS_PAYABLE_REPOSITORY } from '../ports/accounts-payable.repository.interface';
import { PayablePayment } from '../../domain/payable-payment.entity';

@Injectable()
export class GetPayablePaymentsUseCase {
  constructor(
    @Inject(ACCOUNTS_PAYABLE_REPOSITORY)
    private readonly repo: AccountsPayableRepository,
  ) {}

  async execute(accountPayableId: string): Promise<PayablePayment[]> {
    return this.repo.getPayments(accountPayableId);
  }
}

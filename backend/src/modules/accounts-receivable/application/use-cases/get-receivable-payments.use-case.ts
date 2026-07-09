import { Inject, Injectable } from '@nestjs/common';
import {
  AccountsReceivableRepository,
  ACCOUNTS_RECEIVABLE_REPOSITORY,
} from '../ports/accounts-receivable.repository.interface';
import { ReceivablePayment } from '../../domain/receivable-payment.entity';

@Injectable()
export class GetReceivablePaymentsUseCase {
  constructor(
    @Inject(ACCOUNTS_RECEIVABLE_REPOSITORY)
    private readonly repo: AccountsReceivableRepository,
  ) {}

  async execute(
    accountReceivableId: string,
    tenantId: string,
  ): Promise<ReceivablePayment[]> {
    return this.repo.getPayments(accountReceivableId, tenantId);
  }
}

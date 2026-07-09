import { Inject, Injectable } from '@nestjs/common';
import {
  AccountsReceivableRepository,
  ACCOUNTS_RECEIVABLE_REPOSITORY,
} from '../ports/accounts-receivable.repository.interface';
import { AccountsReceivable } from '../../domain/accounts-receivable.entity';

@Injectable()
export class ListByCustomerUseCase {
  constructor(
    @Inject(ACCOUNTS_RECEIVABLE_REPOSITORY)
    private readonly repo: AccountsReceivableRepository,
  ) {}

  async execute(
    customerId: string,
    tenantId: string,
  ): Promise<AccountsReceivable[]> {
    return this.repo.findByCustomer(customerId, tenantId);
  }
}

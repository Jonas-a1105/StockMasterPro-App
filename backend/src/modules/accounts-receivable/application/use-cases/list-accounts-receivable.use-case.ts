import { Inject, Injectable } from '@nestjs/common';
import {
  AccountsReceivableRepository,
  ACCOUNTS_RECEIVABLE_REPOSITORY,
} from '../ports/accounts-receivable.repository.interface';
import { AccountsReceivable } from '../../domain/accounts-receivable.entity';

@Injectable()
export class ListAccountsReceivableUseCase {
  constructor(
    @Inject(ACCOUNTS_RECEIVABLE_REPOSITORY)
    private readonly repo: AccountsReceivableRepository,
  ) {}

  async execute(tenantId: string): Promise<AccountsReceivable[]> {
    return this.repo.findAll(tenantId);
  }
}

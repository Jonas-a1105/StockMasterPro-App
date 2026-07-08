import { Inject, Injectable } from '@nestjs/common';
import {
  AccountsReceivableRepository,
  ACCOUNTS_RECEIVABLE_REPOSITORY,
} from '../ports/accounts-receivable.repository.interface';
import { AccountsReceivable } from '../../domain/accounts-receivable.entity';
import { ReceivableNotFoundException } from '../../domain/accounts-receivable.errors';

@Injectable()
export class FindAccountsReceivableByIdUseCase {
  constructor(
    @Inject(ACCOUNTS_RECEIVABLE_REPOSITORY)
    private readonly repo: AccountsReceivableRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<AccountsReceivable> {
    const receivable = await this.repo.findById(id, tenantId);
    if (!receivable) throw new ReceivableNotFoundException();
    return receivable;
  }
}

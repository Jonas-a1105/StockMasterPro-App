import { Inject, Injectable } from '@nestjs/common';
import { AccountsPayableRepository, ACCOUNTS_PAYABLE_REPOSITORY } from '../ports/accounts-payable.repository.interface';
import { AccountsPayable } from '../../domain/accounts-payable.entity';

@Injectable()
export class ListAccountsPayableUseCase {
  constructor(
    @Inject(ACCOUNTS_PAYABLE_REPOSITORY)
    private readonly repo: AccountsPayableRepository,
  ) {}

  async execute(tenantId: string): Promise<AccountsPayable[]> {
    return this.repo.findAll(tenantId);
  }
}

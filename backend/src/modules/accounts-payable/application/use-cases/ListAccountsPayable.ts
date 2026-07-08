import { Inject, Injectable } from '@nestjs/common';
import { AccountsPayableRepository, ACCOUNTS_PAYABLE_REPOSITORY } from '../ports/AccountsPayableRepository.interface';
import { AccountsPayable } from '../../domain/AccountsPayable';

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

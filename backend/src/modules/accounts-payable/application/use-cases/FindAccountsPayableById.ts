import { Inject, Injectable } from '@nestjs/common';
import { AccountsPayableRepository, ACCOUNTS_PAYABLE_REPOSITORY } from '../ports/AccountsPayableRepository.interface';
import { AccountsPayable } from '../../domain/AccountsPayable';

@Injectable()
export class FindAccountsPayableByIdUseCase {
  constructor(
    @Inject(ACCOUNTS_PAYABLE_REPOSITORY)
    private readonly repo: AccountsPayableRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<AccountsPayable | null> {
    return this.repo.findById(id, tenantId);
  }
}

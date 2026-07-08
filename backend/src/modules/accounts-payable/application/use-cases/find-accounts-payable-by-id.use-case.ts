import { Inject, Injectable } from '@nestjs/common';
import { AccountsPayableRepository, ACCOUNTS_PAYABLE_REPOSITORY } from '../ports/accounts-payable.repository.interface';
import { AccountsPayable } from '../../domain/accounts-payable.entity';
import { PayableNotFoundException } from '../../domain/accounts-payable.errors';

@Injectable()
export class FindAccountsPayableByIdUseCase {
  constructor(
    @Inject(ACCOUNTS_PAYABLE_REPOSITORY)
    private readonly repo: AccountsPayableRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<AccountsPayable> {
    const result = await this.repo.findById(id, tenantId);
    if (!result) throw new PayableNotFoundException();
    return result;
  }
}

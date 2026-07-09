import { Inject, Injectable } from '@nestjs/common';
import {
  AccountsPayableRepository,
  ACCOUNTS_PAYABLE_REPOSITORY,
} from '../ports/accounts-payable.repository.interface';
import { AccountsPayable } from '../../domain/accounts-payable.entity';
import { PaginatedResult, paginate } from '@shared/application/pagination';

@Injectable()
export class ListAccountsPayableUseCase {
  constructor(
    @Inject(ACCOUNTS_PAYABLE_REPOSITORY)
    private readonly repo: AccountsPayableRepository,
  ) {}

  async execute(
    tenantId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<AccountsPayable>> {
    const { take, skip } = paginate(page, limit);
    const [data, total] = await Promise.all([
      this.repo.findAll(tenantId, take, skip),
      this.repo.count(tenantId),
    ]);
    return { data, total, limit: take, offset: skip };
  }
}

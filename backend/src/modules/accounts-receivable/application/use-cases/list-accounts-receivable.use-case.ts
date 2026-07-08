import { Inject, Injectable } from '@nestjs/common';
import {
  AccountsReceivableRepository,
  ACCOUNTS_RECEIVABLE_REPOSITORY,
} from '../ports/accounts-receivable.repository.interface';
import { AccountsReceivable } from '../../domain/accounts-receivable.entity';
import { PaginatedResult, paginate } from '@shared/application/pagination';

@Injectable()
export class ListAccountsReceivableUseCase {
  constructor(
    @Inject(ACCOUNTS_RECEIVABLE_REPOSITORY)
    private readonly repo: AccountsReceivableRepository,
  ) {}

  async execute(tenantId: string, page = 1, limit = 50): Promise<PaginatedResult<AccountsReceivable>> {
    const { take, skip } = paginate(page, limit);
    const [data, total] = await Promise.all([
      this.repo.findAll(tenantId, take, skip),
      this.repo.count(tenantId),
    ]);
    return { data, total, limit: take, offset: skip };
  }
}

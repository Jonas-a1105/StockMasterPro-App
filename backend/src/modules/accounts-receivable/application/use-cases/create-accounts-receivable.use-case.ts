import { Inject, Injectable } from '@nestjs/common';
import {
  AccountsReceivableRepository,
  ACCOUNTS_RECEIVABLE_REPOSITORY,
  CreateReceivableData,
} from '../ports/accounts-receivable.repository.interface';
import { AccountsReceivable } from '../../domain/accounts-receivable.entity';

@Injectable()
export class CreateAccountsReceivableUseCase {
  constructor(
    @Inject(ACCOUNTS_RECEIVABLE_REPOSITORY)
    private readonly repo: AccountsReceivableRepository,
  ) {}

  async execute(data: CreateReceivableData): Promise<AccountsReceivable> {
    return this.repo.create(data);
  }
}

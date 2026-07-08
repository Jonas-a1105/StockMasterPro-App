import { Injectable } from '@nestjs/common';
import { PostgresAccountsPayableRepo } from './PostgresAccountsPayableRepo';
import { CreateAccountsPayable } from '../core/CreateAccountsPayable';
import { PayAccountsPayable } from '../core/PayAccountsPayable';

@Injectable()
export class AccountsPayableService {
  constructor(private readonly repo: PostgresAccountsPayableRepo) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async findById(id: string) {
    return this.repo.findById(id);
  }

  async create(dto: any, tenantId: string) {
    const useCase = new CreateAccountsPayable(this.repo);
    return useCase.execute({ ...dto, tenantId });
  }

  async pay(dto: any, tenantId: string) {
    const useCase = new PayAccountsPayable(this.repo);
    return useCase.execute({ ...dto, tenantId, paidAt: new Date().toISOString() });
  }

  async getPayments(accountPayableId: string) {
    return this.repo.getPayments(accountPayableId);
  }
}

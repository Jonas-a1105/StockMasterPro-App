import { Injectable } from '@nestjs/common';
import { PostgresAccountsPayableRepo } from './persistence/PostgresAccountsPayableRepo';
import { CreateAccountsPayable } from '../application/use-cases/CreateAccountsPayable';
import { PayAccountsPayable } from '../application/use-cases/PayAccountsPayable';

@Injectable()
export class AccountsPayableService {
  constructor(private readonly repo: PostgresAccountsPayableRepo) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async findById(id: string, tenantId: string) {
    return this.repo.findById(id, tenantId);
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

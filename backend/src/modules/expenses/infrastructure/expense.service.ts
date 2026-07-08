import { Injectable } from '@nestjs/common';
import { PostgresExpenseRepo } from './persistence/PostgresExpenseRepo';
import { CreateExpense } from '../application/use-cases/CreateExpense';

@Injectable()
export class ExpenseService {
  constructor(private readonly repo: PostgresExpenseRepo) {}

  async findAll(tenantId: string, category?: string, startDate?: string, endDate?: string) {
    return this.repo.findAll({ tenantId, category, startDate, endDate });
  }

  async findById(id: string) {
    return this.repo.findById(id);
  }

  async create(dto: any, userId: string, tenantId: string) {
    const useCase = new CreateExpense(this.repo);
    return useCase.execute({ ...dto, registeredBy: userId, tenantId, paymentMethod: dto.paymentMethod || 'cash' });
  }

  async delete(id: string, tenantId: string) {
    await this.repo.delete(id, tenantId);
  }

  async getTotalByCategory(tenantId: string, startDate?: string, endDate?: string) {
    return this.repo.getTotalByCategory(tenantId, startDate, endDate);
  }
}

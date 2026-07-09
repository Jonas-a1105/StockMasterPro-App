import { Injectable } from '@nestjs/common';
import {
  PostgresExpenseRepo,
  CreateExpenseData,
} from './persistence/postgres-expense.repository';

@Injectable()
export class ExpenseService {
  constructor(private readonly repo: PostgresExpenseRepo) {}

  async findAll(
    tenantId: string,
    category?: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.repo.findAll({ tenantId, category, startDate, endDate });
  }

  async findById(id: string, tenantId: string) {
    return this.repo.findById(id, tenantId);
  }

  async create(dto: CreateExpenseData) {
    return this.repo.create(dto);
  }

  async delete(id: string, tenantId: string) {
    await this.repo.delete(id, tenantId);
  }

  async getTotalByCategory(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.repo.getTotalByCategory(tenantId, startDate, endDate);
  }
}

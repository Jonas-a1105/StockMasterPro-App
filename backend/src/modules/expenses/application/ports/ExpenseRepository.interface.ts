import { Expense } from '../../domain/Expense';

export interface CreateExpenseData {
  tenantId: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod?: string;
  notes?: string;
  registeredBy: string;
  expenseDate: string;
}

export interface ExpenseFilter {
  tenantId: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseRepository {
  findAll(filter: ExpenseFilter): Promise<Expense[]>;
  findById(id: string): Promise<Expense | null>;
  create(data: CreateExpenseData): Promise<Expense>;
  delete(id: string, tenantId: string): Promise<void>;
  getTotalByCategory(tenantId: string, startDate?: string, endDate?: string): Promise<{ category: string; total: number }[]>;
}

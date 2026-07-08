import { ExpenseRepository, CreateExpenseData } from './interfaces/ExpenseRepository.interface';
import { Expense } from '../domain/Expense';

export class CreateExpense {
  constructor(private readonly repo: ExpenseRepository) {}

  async execute(data: CreateExpenseData): Promise<Expense> {
    if (!data.description?.trim()) throw new Error('La descripción es obligatoria');
    if (data.amount <= 0) throw new Error('El monto debe ser mayor a cero');
    return this.repo.create(data);
  }
}

export type ExpenseCategory = 'rent' | 'utilities' | 'salaries' | 'supplies' | 'maintenance' | 'transport' | 'marketing' | 'food' | 'other';

export class Expense {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly description: string,
    public readonly amount: number,
    public readonly category: ExpenseCategory,
    public readonly paymentMethod: string,
    public readonly notes: string | null,
    public readonly registeredBy: string,
    public readonly expenseDate: Date,
    public readonly createdAt: Date,
  ) {}
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExpenseRepository, CreateExpenseData, ExpenseFilter } from '../core/interfaces/ExpenseRepository.interface';
import { Expense } from '../domain/Expense';

@Injectable()
export class PostgresExpenseRepo implements ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ExpenseFilter): Promise<Expense[]> {
    const where: any = { tenantId: filter.tenantId };
    if (filter.category) where.category = filter.category;
    if (filter.startDate || filter.endDate) {
      where.expenseDate = {};
      if (filter.startDate) where.expenseDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.expenseDate.lte = new Date(filter.endDate);
    }
    const rows = await this.prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' } });
    return rows.map(r => this.toDomain(r));
  }

  async findById(id: string): Promise<Expense | null> {
    const row = await this.prisma.expense.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateExpenseData): Promise<Expense> {
    const row = await this.prisma.expense.create({
      data: {
        tenantId: data.tenantId,
        description: data.description,
        amount: data.amount,
        category: data.category,
        paymentMethod: data.paymentMethod || 'cash',
        notes: data.notes,
        registeredBy: data.registeredBy,
        expenseDate: new Date(data.expenseDate),
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.expense.deleteMany({ where: { id, tenantId } });
  }

  async getTotalByCategory(tenantId: string, startDate?: string, endDate?: string): Promise<{ category: string; total: number }[]> {
    const where: any = { tenantId };
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }
    const rows = await this.prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
    });
    return rows.map(r => ({ category: r.category, total: Number(r._sum.amount) }));
  }

  private toDomain(row: any): Expense {
    return new Expense(row.id, row.tenantId, row.description, Number(row.amount), row.category, row.paymentMethod, row.notes, row.registeredBy, row.expenseDate, row.createdAt);
  }
}

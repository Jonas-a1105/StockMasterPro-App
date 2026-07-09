import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

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

@Injectable()
export class PostgresExpenseRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ExpenseFilter) {
    const where: any = { tenantId: filter.tenantId };
    if (filter.category) where.category = filter.category;
    if (filter.startDate || filter.endDate) {
      where.expenseDate = {};
      if (filter.startDate) where.expenseDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.expenseDate.lte = new Date(filter.endDate);
    }
    return this.prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.expense.findFirst({ where: { id, tenantId } });
  }

  async create(data: CreateExpenseData) {
    return this.prisma.expense.create({
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
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.expense.deleteMany({ where: { id, tenantId } });
  }

  async getTotalByCategory(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ category: string; total: number }[]> {
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
    return rows.map((r) => ({
      category: r.category,
      total: Number(r._sum.amount),
    }));
  }
}

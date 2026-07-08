import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountsPayableRepository, CreatePayableData, PayablePaymentData } from '../core/interfaces/AccountsPayableRepository.interface';
import { AccountsPayable } from '../domain/AccountsPayable';
import { PayablePayment } from '../domain/PayablePayment';

@Injectable()
export class PostgresAccountsPayableRepo implements AccountsPayableRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<AccountsPayable[]> {
    const rows = await this.prisma.accountsPayable.findMany({
      where: { tenantId },
      include: { supplier: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => this.toDomain(r, r.payments));
  }

  async findById(id: string): Promise<AccountsPayable | null> {
    const row = await this.prisma.accountsPayable.findUnique({
      where: { id },
      include: { supplier: true, payments: true },
    });
    return row ? this.toDomain(row, row.payments) : null;
  }

  async create(data: CreatePayableData): Promise<AccountsPayable> {
    const row = await this.prisma.accountsPayable.create({
      data: {
        tenantId: data.tenantId,
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId,
        totalAmount: data.totalAmount,
        pendingAmount: data.totalAmount,
        dueDate: new Date(data.dueDate),
        notes: data.notes,
      },
      include: { supplier: true, payments: true },
    });
    return this.toDomain(row, row.payments);
  }

  async updatePendingAmount(id: string, amount: number): Promise<void> {
    await this.prisma.accountsPayable.update({
      where: { id },
      data: { pendingAmount: amount },
    });
  }

  async markAsPaid(id: string): Promise<void> {
    await this.prisma.accountsPayable.update({
      where: { id },
      data: { status: 'paid' },
    });
  }

  async addPayment(data: PayablePaymentData): Promise<PayablePayment> {
    const row = await this.prisma.payablePayment.create({
      data: {
        tenantId: data.tenantId,
        accountPayableId: data.accountPayableId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        paidAt: new Date(data.paidAt),
      },
    });
    return new PayablePayment(row.id, row.accountPayableId, Number(row.amount), row.paymentMethod as any, row.notes, row.paidAt);
  }

  async getPayments(accountPayableId: string): Promise<PayablePayment[]> {
    const rows = await this.prisma.payablePayment.findMany({
      where: { accountPayableId },
      orderBy: { paidAt: 'desc' },
    });
    return rows.map(r => new PayablePayment(r.id, r.accountPayableId, Number(r.amount), r.paymentMethod as any, r.notes, r.paidAt));
  }

  private toDomain(row: any, payments?: any[]): AccountsPayable {
    return new AccountsPayable(
      row.id,
      row.tenantId,
      row.supplierId,
      row.purchaseOrderId,
      Number(row.totalAmount),
      Number(row.pendingAmount),
      row.dueDate,
      row.status,
      row.notes,
      row.createdAt,
    );
  }
}

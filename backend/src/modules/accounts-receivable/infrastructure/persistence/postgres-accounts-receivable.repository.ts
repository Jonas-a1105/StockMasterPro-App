import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  AccountsReceivableRepository,
  CreateReceivableData,
  ReceivablePaymentData,
} from '../../application/ports/accounts-receivable.repository.interface';
import { AccountsReceivable } from '../../domain/accounts-receivable.entity';
import { ReceivablePayment } from '../../domain/receivable-payment.entity';
import { AccountsReceivable as PrismaReceivable, ReceivablePayment as PrismaPayment } from '@prisma/client';

@Injectable()
export class PostgresAccountsReceivableRepo implements AccountsReceivableRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<AccountsReceivable[]> {
    const records = await this.prisma.accountsReceivable.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findById(id: string, tenantId: string): Promise<AccountsReceivable | null> {
    const record = await this.prisma.accountsReceivable.findFirst({
      where: { id, tenantId },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<AccountsReceivable[]> {
    const records = await this.prisma.accountsReceivable.findMany({
      where: { customerId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async create(data: CreateReceivableData): Promise<AccountsReceivable> {
    const record = await this.prisma.accountsReceivable.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        saleId: data.saleId ?? null,
        totalAmount: data.totalAmount,
        pendingAmount: data.totalAmount,
        dueDate: new Date(data.dueDate),
        notes: data.notes ?? null,
      },
    });
    return this.toDomain(record);
  }

  async updateStatus(id: string, tenantId: string, pendingAmount: number, status: string): Promise<void> {
    const { count } = await this.prisma.accountsReceivable.updateMany({
      where: { id, tenantId },
      data: { pendingAmount, status },
    });
    if (count === 0) {
      throw new Error(`AccountsReceivable ${id} not found for tenant ${tenantId}`);
    }
  }

  async addPayment(data: ReceivablePaymentData): Promise<ReceivablePayment> {
    const record = await this.prisma.receivablePayment.create({
      data: {
        tenantId: data.tenantId,
        accountReceivableId: data.accountReceivableId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes ?? null,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      },
    });
    return this.toPaymentDomain(record);
  }

  async getPayments(accountReceivableId: string, tenantId: string): Promise<ReceivablePayment[]> {
    const records = await this.prisma.receivablePayment.findMany({
      where: { accountReceivableId, tenantId },
      orderBy: { paidAt: 'desc' },
    });
    return records.map((r) => this.toPaymentDomain(r));
  }

  private toDomain(r: PrismaReceivable): AccountsReceivable {
    return new AccountsReceivable(
      r.id,
      r.tenantId,
      r.customerId,
      r.saleId,
      Number(r.totalAmount),
      Number(r.pendingAmount),
      r.dueDate,
      r.status as 'pending' | 'paid' | 'overdue',
      r.notes,
      r.createdAt,
      r.updatedAt,
    );
  }

  private toPaymentDomain(r: PrismaPayment): ReceivablePayment {
    return new ReceivablePayment(
      r.id,
      r.tenantId,
      r.accountReceivableId,
      Number(r.amount),
      r.paymentMethod,
      r.notes,
      r.paidAt,
      r.createdAt,
    );
  }
}

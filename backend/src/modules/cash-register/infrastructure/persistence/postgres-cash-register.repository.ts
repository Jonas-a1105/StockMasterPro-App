import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  CashRegisterRepository,
  OpenSessionData,
  CreateTransactionData,
} from '../../application/ports/cash-register.repository.interface';
import { CashSession } from '../../domain/cash-session.entity';
import { CashTransaction } from '../../domain/cash-transaction.entity';
import {
  CashSession as PrismaCashSession,
  CashTransaction as PrismaCashTransaction,
} from '@prisma/client';

@Injectable()
export class PostgresCashRegisterRepo implements CashRegisterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOpenSession(
    userId: string,
    tenantId: string,
  ): Promise<CashSession | null> {
    const record = await this.prisma.cashSession.findFirst({
      where: { userId, tenantId, status: 'open' },
    });
    return record ? this.toSessionDomain(record) : null;
  }

  async findById(id: string, tenantId: string): Promise<CashSession | null> {
    const record = await this.prisma.cashSession.findFirst({
      where: { id, tenantId },
    });
    return record ? this.toSessionDomain(record) : null;
  }

  async findAll(tenantId: string): Promise<CashSession[]> {
    const records = await this.prisma.cashSession.findMany({
      where: { tenantId },
      orderBy: { openedAt: 'desc' },
    });
    return records.map((r) => this.toSessionDomain(r));
  }

  async openSession(data: OpenSessionData): Promise<CashSession> {
    const record = await this.prisma.cashSession.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        openingBalance: data.openingBalance,
        notes: data.notes ?? null,
      },
    });
    return this.toSessionDomain(record);
  }

  async closeSession(
    id: string,
    tenantId: string,
    closingBalance: number,
    actualBalance: number,
    difference: number,
  ): Promise<void> {
    const { count } = await this.prisma.cashSession.updateMany({
      where: { id, tenantId },
      data: {
        closingBalance,
        actualBalance,
        difference,
        status: 'closed',
        closedAt: new Date(),
      },
    });
    if (count === 0) {
      throw new Error(`CashSession ${id} not found for tenant ${tenantId}`);
    }
  }

  async addTransaction(data: CreateTransactionData): Promise<CashTransaction> {
    const record = await this.prisma.cashTransaction.create({
      data: {
        tenantId: data.tenantId,
        sessionId: data.sessionId,
        amount: data.amount,
        type: data.type,
        description: data.description,
      },
    });
    return this.toTransactionDomain(record);
  }

  async getTransactions(
    sessionId: string,
    tenantId: string,
  ): Promise<CashTransaction[]> {
    const records = await this.prisma.cashTransaction.findMany({
      where: { sessionId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toTransactionDomain(r));
  }

  async sumTransactions(sessionId: string, tenantId: string): Promise<number> {
    const records = await this.prisma.cashTransaction.findMany({
      where: { sessionId, tenantId },
      select: { amount: true, type: true },
    });

    let sum = 0;
    for (const r of records) {
      const amount = Number(r.amount);
      if (r.type === 'income' || r.type === 'sale') {
        sum += amount;
      } else {
        sum -= amount;
      }
    }
    return Math.round(sum * 100) / 100;
  }

  private toSessionDomain(r: PrismaCashSession): CashSession {
    return new CashSession(
      r.id,
      r.tenantId,
      r.userId,
      Number(r.openingBalance),
      r.closingBalance !== null ? Number(r.closingBalance) : null,
      r.actualBalance !== null ? Number(r.actualBalance) : null,
      r.difference !== null ? Number(r.difference) : null,
      r.status as 'open' | 'closed',
      r.openedAt,
      r.closedAt,
      r.notes,
      r.createdAt,
      r.updatedAt,
    );
  }

  private toTransactionDomain(r: PrismaCashTransaction): CashTransaction {
    return new CashTransaction(
      r.id,
      r.tenantId,
      r.sessionId,
      Number(r.amount),
      r.type,
      r.description,
      r.createdAt,
    );
  }
}

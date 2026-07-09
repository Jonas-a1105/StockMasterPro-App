import { CashSession } from '../../domain/cash-session.entity';
import { CashTransaction } from '../../domain/cash-transaction.entity';

export const CASH_REGISTER_REPOSITORY = Symbol('CASH_REGISTER_REPOSITORY');

export interface OpenSessionData {
  tenantId: string;
  userId: string;
  openingBalance: number;
  notes?: string;
}

export interface CreateTransactionData {
  tenantId: string;
  sessionId: string;
  amount: number;
  type: 'income' | 'expense' | 'sale' | 'refund';
  description: string;
}

export interface CashRegisterRepository {
  findOpenSession(
    userId: string,
    tenantId: string,
  ): Promise<CashSession | null>;
  findById(id: string, tenantId: string): Promise<CashSession | null>;
  findAll(tenantId: string): Promise<CashSession[]>;
  openSession(data: OpenSessionData): Promise<CashSession>;
  closeSession(
    id: string,
    tenantId: string,
    closingBalance: number,
    actualBalance: number,
    difference: number,
  ): Promise<void>;
  addTransaction(data: CreateTransactionData): Promise<CashTransaction>;
  getTransactions(
    sessionId: string,
    tenantId: string,
  ): Promise<CashTransaction[]>;
  sumTransactions(sessionId: string, tenantId: string): Promise<number>;
}

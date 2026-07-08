import { AccountsReceivable } from '../../domain/accounts-receivable.entity';
import { ReceivablePayment } from '../../domain/receivable-payment.entity';

export const ACCOUNTS_RECEIVABLE_REPOSITORY = Symbol('ACCOUNTS_RECEIVABLE_REPOSITORY');

export interface CreateReceivableData {
  tenantId: string;
  customerId: string;
  saleId?: string;
  totalAmount: number;
  dueDate: string;
  notes?: string;
}

export interface ReceivablePaymentData {
  tenantId: string;
  accountReceivableId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  notes?: string;
  paidAt: string;
}

export interface AccountsReceivableRepository {
  findAll(tenantId: string): Promise<AccountsReceivable[]>;
  findById(id: string, tenantId: string): Promise<AccountsReceivable | null>;
  findByCustomer(customerId: string, tenantId: string): Promise<AccountsReceivable[]>;
  create(data: CreateReceivableData): Promise<AccountsReceivable>;
  updateStatus(id: string, tenantId: string, pendingAmount: number, status: string): Promise<void>;
  addPayment(data: ReceivablePaymentData): Promise<ReceivablePayment>;
  getPayments(accountReceivableId: string, tenantId: string): Promise<ReceivablePayment[]>;
}

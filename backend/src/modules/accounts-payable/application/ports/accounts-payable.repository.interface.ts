import { AccountsPayable } from '../../domain/accounts-payable.entity';
import { PayablePayment } from '../../domain/payable-payment.entity';

export const ACCOUNTS_PAYABLE_REPOSITORY = Symbol('ACCOUNTS_PAYABLE_REPOSITORY');

export interface CreatePayableData {
  tenantId: string;
  supplierId: string;
  purchaseOrderId?: string;
  totalAmount: number;
  dueDate: string;
  notes?: string;
}

export interface PayablePaymentData {
  tenantId: string;
  accountPayableId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  notes?: string;
  paidAt: string;
}

export interface AccountsPayableRepository {
  findAll(tenantId: string): Promise<AccountsPayable[]>;
  findById(id: string, tenantId: string): Promise<AccountsPayable | null>;
  create(data: CreatePayableData): Promise<AccountsPayable>;
  updatePendingAmount(id: string, tenantId: string, amount: number): Promise<void>;
  markAsPaid(id: string, tenantId: string): Promise<void>;
  addPayment(data: PayablePaymentData): Promise<PayablePayment>;
  getPayments(accountPayableId: string): Promise<PayablePayment[]>;
}

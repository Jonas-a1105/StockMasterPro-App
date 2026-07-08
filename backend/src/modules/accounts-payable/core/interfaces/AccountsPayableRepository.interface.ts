import { AccountsPayable } from '../../domain/AccountsPayable';
import { PayablePayment } from '../../domain/PayablePayment';

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
  findById(id: string): Promise<AccountsPayable | null>;
  create(data: CreatePayableData): Promise<AccountsPayable>;
  updatePendingAmount(id: string, amount: number): Promise<void>;
  markAsPaid(id: string): Promise<void>;
  addPayment(data: PayablePaymentData): Promise<PayablePayment>;
  getPayments(accountPayableId: string): Promise<PayablePayment[]>;
}

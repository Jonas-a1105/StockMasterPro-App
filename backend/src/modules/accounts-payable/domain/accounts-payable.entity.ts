import {
  PayableAlreadyPaidException,
  InvalidPaymentAmountException,
} from './accounts-payable.errors';

export type PayableStatus = 'pending' | 'paid' | 'overdue';

export class AccountsPayable {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly supplierId: string,
    public readonly purchaseOrderId: string | null,
    public readonly totalAmount: number,
    public readonly pendingAmount: number,
    public readonly dueDate: Date,
    public readonly status: PayableStatus,
    public readonly notes: string | null,
    public readonly createdAt: Date,
  ) {}

  isOverdue(): boolean {
    return this.status === 'pending' && new Date() > this.dueDate;
  }

  isFullyPaid(): boolean {
    return this.pendingAmount <= 0;
  }

  applyPayment(amount: number): number {
    if (this.status === 'paid') throw new PayableAlreadyPaidException();
    if (amount <= 0)
      throw new InvalidPaymentAmountException(
        'El monto del abono debe ser mayor a cero',
      );
    if (amount > this.pendingAmount)
      throw new InvalidPaymentAmountException(
        'El abono excede el saldo pendiente',
      );
    return this.pendingAmount - amount;
  }
}

import {
  ReceivableAlreadyPaidException,
  InvalidReceivablePaymentException,
} from './accounts-receivable.errors';

export class AccountsReceivable {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly saleId: string | null,
    public readonly totalAmount: number,
    public readonly pendingAmount: number,
    public readonly dueDate: Date,
    public readonly status: 'pending' | 'paid' | 'overdue',
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  applyPayment(amount: number): { newPendingAmount: number; newStatus: 'pending' | 'paid' } {
    if (this.status === 'paid') {
      throw new ReceivableAlreadyPaidException();
    }
    if (amount <= 0) {
      throw new InvalidReceivablePaymentException('El monto del abono debe ser mayor a cero');
    }
    if (amount > this.pendingAmount) {
      throw new InvalidReceivablePaymentException(
        `El abono excede el saldo pendiente. Pendiente: $${this.pendingAmount.toFixed(2)}, Solicitado: $${amount.toFixed(2)}`
      );
    }
    const newPendingAmount = Math.round((this.pendingAmount - amount) * 100) / 100;
    const newStatus = newPendingAmount === 0 ? 'paid' : 'pending';
    return { newPendingAmount, newStatus };
  }
}

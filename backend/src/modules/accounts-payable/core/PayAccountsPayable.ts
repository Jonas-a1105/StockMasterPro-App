import { AccountsPayableRepository, PayablePaymentData } from './interfaces/AccountsPayableRepository.interface';
import { PayablePayment } from '../domain/PayablePayment';

export class PayAccountsPayable {
  constructor(private readonly repo: AccountsPayableRepository) {}

  async execute(data: PayablePaymentData): Promise<PayablePayment> {
    const payable = await this.repo.findById(data.accountPayableId);
    if (!payable) throw new Error('Cuenta por pagar no encontrada');
    if (payable.status === 'paid') throw new Error('Esta cuenta ya está pagada');
    if (data.amount <= 0) throw new Error('El monto del abono debe ser mayor a cero');
    if (data.amount > payable.pendingAmount) throw new Error('El abono excede el saldo pendiente');

    const payment = await this.repo.addPayment(data);
    const newPending = payable.pendingAmount - data.amount;
    await this.repo.updatePendingAmount(data.accountPayableId, newPending);
    if (newPending <= 0) {
      await this.repo.markAsPaid(data.accountPayableId);
    }
    return payment;
  }
}

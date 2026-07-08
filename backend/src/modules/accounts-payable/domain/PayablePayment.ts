export type PaymentMethod = 'cash' | 'card' | 'transfer';

export class PayablePayment {
  constructor(
    public readonly id: string,
    public readonly accountPayableId: string,
    public readonly amount: number,
    public readonly paymentMethod: PaymentMethod,
    public readonly notes: string | null,
    public readonly paidAt: Date,
  ) {}
}

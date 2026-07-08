export type RefundMethod = 'credit' | 'cash' | 'transfer';

export class CreditNote {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly saleId: string | null,
    public readonly customerId: string | null,
    public readonly userId: string,
    public readonly reason: string,
    public readonly total: number,
    public readonly status: string,
    public readonly refundMethod: RefundMethod,
    public readonly createdAt: Date,
  ) {}
}

export class ReceivablePayment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly accountReceivableId: string,
    public readonly amount: number,
    public readonly paymentMethod: string,
    public readonly notes: string | null,
    public readonly paidAt: Date,
    public readonly createdAt: Date,
  ) {}
}

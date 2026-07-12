export class SalePayment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly saleId: string,
    public readonly paymentMethod: string,
    public readonly amount: number,
    public readonly exchangeRate: number | null = null,
    public readonly reference: string | null = null,
    public readonly createdAt: Date = new Date(),
  ) {}
}

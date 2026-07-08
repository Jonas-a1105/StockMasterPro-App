export class CashTransaction {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly sessionId: string,
    public readonly amount: number,
    public readonly type: string,
    public readonly description: string,
    public readonly createdAt: Date,
  ) {}
}

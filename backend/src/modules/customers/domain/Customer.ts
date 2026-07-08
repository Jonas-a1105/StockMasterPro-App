export class Customer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly address: string | null,
    public readonly creditLimit: number,
    public readonly balance: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

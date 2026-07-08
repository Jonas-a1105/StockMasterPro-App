export class Supplier {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly contact: string | null,
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly address: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

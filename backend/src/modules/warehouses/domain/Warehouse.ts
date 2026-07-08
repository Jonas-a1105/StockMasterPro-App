export class Warehouse {
  constructor(
    public readonly id: string,
    public tenantId: string,
    public name: string,
    public code: string,
    public address: string | null,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}

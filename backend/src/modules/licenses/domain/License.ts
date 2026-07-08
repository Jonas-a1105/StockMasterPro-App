export class License {
  constructor(
    public readonly tenantId: string,
    public readonly expiresAt: Date,
    public readonly tier: string,
  ) {}

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}

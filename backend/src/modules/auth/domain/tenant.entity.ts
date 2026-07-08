export class Tenant {
  constructor(
    public readonly id: string,
    public name: string,
    public planType: string,
    public subscriptionStatus: string,
    public licenseExpiresAt: Date,
    public isBlocked: boolean,
  ) {}

  isActive(): boolean {
    return (
      !this.isBlocked &&
      this.subscriptionStatus !== 'canceled' &&
      new Date() <= this.licenseExpiresAt
    );
  }
}

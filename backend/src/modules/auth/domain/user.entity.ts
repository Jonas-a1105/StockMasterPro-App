export class User {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public email: string,
    public passwordHash: string,
    public name: string,
    public role: string,
    public isActive: boolean,
    public readonly isPlatformAdmin: boolean = false,
  ) {}

  can(requiredRole: string): boolean {
    const hierarchy: Record<string, number> = {
      cajero: 1,
      gerente: 2,
      admin: 3,
    };
    return (hierarchy[this.role] ?? 0) >= (hierarchy[requiredRole] ?? 0);
  }
}

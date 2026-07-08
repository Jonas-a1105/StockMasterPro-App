import { AuthRepository } from './interfaces/AuthRepository.interface';

export class RegisterTenant {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(
    name: string,
    adminEmail: string,
    adminPasswordHash: string,
    adminName: string,
  ) {
    const licenseExpiresAt = new Date();
    licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 1);

    const tenant = await this.authRepo.createTenant({ name, licenseExpiresAt });
    const user = await this.authRepo.createUser({
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: adminName,
      role: 'user',
    });

    return { tenant, user };
  }
}

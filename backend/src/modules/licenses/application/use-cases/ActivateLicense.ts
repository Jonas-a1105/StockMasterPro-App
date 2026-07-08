import { LicenseRepository } from '../ports/LicenseRepository.interface';

export class ActivateLicense {
  constructor(private readonly licenseRepo: LicenseRepository) {}

  async execute(tenantId: string, targetTenantId: string | undefined | null, expiresAt: Date): Promise<void> {
    if (targetTenantId && tenantId !== targetTenantId) {
      throw new Error('Esta licencia no corresponde a este negocio');
    }
    const finalTenantId = targetTenantId || tenantId;
    await this.licenseRepo.updateLicense(finalTenantId, expiresAt, 'pro');
  }
}

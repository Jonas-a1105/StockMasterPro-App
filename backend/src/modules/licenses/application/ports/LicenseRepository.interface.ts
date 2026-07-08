import { Tenant } from '../../../auth/domain/Tenant';

export interface LicenseRepository {
  findTenantById(id: string): Promise<Tenant | null>;
  updateLicense(tenantId: string, expiresAt: Date, tier: string): Promise<void>;
  markAsBlocked(tenantId: string): Promise<void>;
  markAsCanceled(tenantId: string): Promise<void>;
  markAsActive(tenantId: string): Promise<void>;
  updatePlan(tenantId: string, planType: string): Promise<{ message: string; planType: string }>;
}

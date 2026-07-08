import { User } from '../../domain/User';
import { Tenant } from '../../domain/Tenant';

export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createTenant(data: { name: string; licenseExpiresAt: Date }): Promise<Tenant>;
  createUser(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
  }): Promise<User>;
  findTenantById(id: string): Promise<Tenant | null>;
}

import { User } from '../../domain/User';

export interface UserRepository {
  findAll(tenantId: string): Promise<User[]>;
  findById(id: string, tenantId: string): Promise<User | null>;
  create(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
  }): Promise<User>;
  update(
    id: string,
    tenantId: string,
    data: Partial<{
      email: string;
      name: string;
      role: string;
      isActive: boolean;
    }>,
  ): Promise<User>;
  delete(id: string, tenantId: string): Promise<void>;
}

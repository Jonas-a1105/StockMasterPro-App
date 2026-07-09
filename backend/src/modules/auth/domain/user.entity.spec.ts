import { User } from './user.entity';

describe('User entity', () => {
  const createUser = (role: string) =>
    new User('user-1', 'tenant-1', 'test@test.com', 'hash', 'Test', role, true);

  it('should allow admin to perform admin actions', () => {
    expect(createUser('admin').can('admin')).toBe(true);
  });

  it('should allow gerente to perform gerente actions', () => {
    expect(createUser('gerente').can('gerente')).toBe(true);
  });

  it('should allow cajero to perform cajero actions', () => {
    expect(createUser('cajero').can('cajero')).toBe(true);
  });

  it('should deny cajero from performing gerente actions', () => {
    expect(createUser('cajero').can('gerente')).toBe(false);
  });

  it('should deny cajero from performing admin actions', () => {
    expect(createUser('cajero').can('admin')).toBe(false);
  });

  it('should deny gerente from performing admin actions', () => {
    expect(createUser('gerente').can('admin')).toBe(false);
  });

  it('should allow admin to perform any role action', () => {
    const admin = createUser('admin');
    expect(admin.can('cajero')).toBe(true);
    expect(admin.can('gerente')).toBe(true);
    expect(admin.can('admin')).toBe(true);
  });

  it('should treat unknown required role as level 0 (accessible by any known role)', () => {
    expect(createUser('cajero').can('superadmin')).toBe(true);
  });
});

import { Tenant } from './tenant.entity';

describe('Tenant entity', () => {
  const futureDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d;
  };

  const pastDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  };

  it('should be active when not blocked, not canceled, and not expired', () => {
    const tenant = new Tenant(
      't-1',
      'Test',
      'business',
      'active',
      futureDate(),
      false,
    );
    expect(tenant.isActive()).toBe(true);
  });

  it('should not be active when blocked', () => {
    const tenant = new Tenant(
      't-2',
      'Test',
      'business',
      'active',
      futureDate(),
      true,
    );
    expect(tenant.isActive()).toBe(false);
  });

  it('should not be active when subscription is canceled', () => {
    const tenant = new Tenant(
      't-3',
      'Test',
      'business',
      'canceled',
      futureDate(),
      false,
    );
    expect(tenant.isActive()).toBe(false);
  });

  it('should not be active when license is expired', () => {
    const tenant = new Tenant(
      't-4',
      'Test',
      'business',
      'active',
      pastDate(),
      false,
    );
    expect(tenant.isActive()).toBe(false);
  });

  it('should not be active when blocked and expired', () => {
    const tenant = new Tenant(
      't-5',
      'Test',
      'business',
      'canceled',
      pastDate(),
      true,
    );
    expect(tenant.isActive()).toBe(false);
  });
});

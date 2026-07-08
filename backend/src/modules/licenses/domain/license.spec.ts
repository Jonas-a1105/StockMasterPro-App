import { License } from './License';

describe('License', () => {
  it('should detect expired license', () => {
    const past = new Date(Date.now() - 86400000);
    const license = new License('tenant-1', past, 'pro');
    expect(license.isExpired()).toBe(true);
  });

  it('should detect valid license', () => {
    const future = new Date(Date.now() + 86400000);
    const license = new License('tenant-1', future, 'pro');
    expect(license.isExpired()).toBe(false);
  });

  it('should store tier', () => {
    const future = new Date(Date.now() + 86400000);
    const license = new License('tenant-1', future, 'enterprise');
    expect(license.tier).toBe('enterprise');
  });
});

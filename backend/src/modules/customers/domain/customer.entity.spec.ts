import { Customer } from './customer.entity';

describe('Customer Entity', () => {
  const baseCustomer = new Customer(
    'cust-1',
    'tenant-1',
    'Test Customer',
    'test@test.com',
    '555-0000',
    '123 Main St',
    1000,
    200,
    new Date(),
    new Date(),
  );

  describe('payCredit', () => {
    it('should reduce balance correctly', () => {
      const result = baseCustomer.payCredit(100);
      expect(result).toBe(100);
    });

    it('should not go below zero', () => {
      const result = baseCustomer.payCredit(500);
      expect(result).toBe(0);
    });

    it('should throw for zero or negative payment', () => {
      expect(() => baseCustomer.payCredit(0)).toThrow();
      expect(() => baseCustomer.payCredit(-10)).toThrow();
    });
  });

  describe('chargeCredit', () => {
    it('should increase balance correctly', () => {
      const result = baseCustomer.chargeCredit(100);
      expect(result).toBe(300);
    });

    it('should enforce credit limit', () => {
      expect(() => baseCustomer.chargeCredit(900)).toThrow('límite de crédito');
    });

    it('should allow charge up to exact credit limit', () => {
      const result = baseCustomer.chargeCredit(800);
      expect(result).toBe(1000);
    });

    it('should not enforce limit when creditLimit is 0 (unlimited)', () => {
      const unlimited = new Customer(
        'cust-2',
        'tenant-1',
        'Unlimited',
        null,
        null,
        null,
        0,
        5000,
        new Date(),
        new Date(),
      );
      const result = unlimited.chargeCredit(1000);
      expect(result).toBe(6000);
    });

    it('should throw for zero or negative charge', () => {
      expect(() => baseCustomer.chargeCredit(0)).toThrow();
      expect(() => baseCustomer.chargeCredit(-10)).toThrow();
    });
  });
});

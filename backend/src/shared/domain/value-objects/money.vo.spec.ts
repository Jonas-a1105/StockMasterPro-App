import { Money } from './money.vo';

describe('Money Value Object', () => {
  describe('creation', () => {
    it('should create with valid amount and default currency', () => {
      const money = new Money(100);
      expect(money.amount).toBe(100);
      expect(money.currency).toBe('USD');
    });

    it('should create with custom currency', () => {
      const money = new Money(50, 'MXN');
      expect(money.amount).toBe(50);
      expect(money.currency).toBe('MXN');
    });

    it('should round to 2 decimal places', () => {
      const money = new Money(10.456);
      expect(money.amount).toBe(10.46);
    });

    it('should throw for negative amount', () => {
      expect(() => new Money(-1)).toThrow('no puede ser negativo');
    });

    it('should allow zero', () => {
      const money = new Money(0);
      expect(money.amount).toBe(0);
    });
  });

  describe('add', () => {
    it('should add two amounts with same currency', () => {
      const a = new Money(100);
      const b = new Money(50);
      const result = a.add(b);
      expect(result.amount).toBe(150);
      expect(result.currency).toBe('USD');
    });

    it('should throw when adding different currencies', () => {
      const a = new Money(100, 'USD');
      const b = new Money(50, 'MXN');
      expect(() => a.add(b)).toThrow('No se pueden sumar diferentes monedas');
    });

    it('should not mutate original amounts', () => {
      const a = new Money(100);
      const b = new Money(50);
      a.add(b);
      expect(a.amount).toBe(100);
      expect(b.amount).toBe(50);
    });
  });

  describe('subtract', () => {
    it('should subtract two amounts with same currency', () => {
      const a = new Money(100);
      const b = new Money(30);
      const result = a.subtract(b);
      expect(result.amount).toBe(70);
    });

    it('should throw when subtracting different currencies', () => {
      const a = new Money(100, 'USD');
      const b = new Money(30, 'MXN');
      expect(() => a.subtract(b)).toThrow(
        'No se pueden restar diferentes monedas',
      );
    });

    it('should throw if result would be negative', () => {
      const a = new Money(20);
      const b = new Money(50);
      expect(() => a.subtract(b)).toThrow(
        'El saldo resultante no puede ser negativo',
      );
    });

    it('should allow result of zero', () => {
      const a = new Money(50);
      const b = new Money(50);
      const result = a.subtract(b);
      expect(result.amount).toBe(0);
    });
  });

  describe('equals', () => {
    it('should be equal with same amount and currency', () => {
      const a = new Money(100, 'USD');
      const b = new Money(100, 'USD');
      expect(a.equals(b)).toBe(true);
    });

    it('should not be equal with different amount', () => {
      const a = new Money(100);
      const b = new Money(200);
      expect(a.equals(b)).toBe(false);
    });

    it('should not be equal with different currency', () => {
      const a = new Money(100, 'USD');
      const b = new Money(100, 'MXN');
      expect(a.equals(b)).toBe(false);
    });
  });
});

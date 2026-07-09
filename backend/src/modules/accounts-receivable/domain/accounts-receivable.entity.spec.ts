import { AccountsReceivable } from './accounts-receivable.entity';
import {
  ReceivableAlreadyPaidException,
  InvalidReceivablePaymentException,
} from './accounts-receivable.errors';

describe('AccountsReceivable entity', () => {
  it('should reduce pending amount on valid payment', () => {
    const recv = new AccountsReceivable(
      'recv-1',
      'tenant-1',
      'cust-1',
      'sale-1',
      1000,
      1000,
      new Date('2025-12-31'),
      'pending',
      null,
      new Date(),
      new Date(),
    );
    const result = recv.applyPayment(300);
    expect(result.newPendingAmount).toBe(700);
    expect(result.newStatus).toBe('pending');
  });

  it('should mark as paid when payment clears the balance', () => {
    const recv = new AccountsReceivable(
      'recv-2',
      'tenant-1',
      'cust-1',
      'sale-1',
      500,
      500,
      new Date('2025-12-31'),
      'pending',
      null,
      new Date(),
      new Date(),
    );
    const result = recv.applyPayment(500);
    expect(result.newPendingAmount).toBe(0);
    expect(result.newStatus).toBe('paid');
  });

  it('should throw if payment exceeds pending amount', () => {
    const recv = new AccountsReceivable(
      'recv-3',
      'tenant-1',
      'cust-1',
      'sale-1',
      1000,
      500,
      new Date('2025-12-31'),
      'pending',
      null,
      new Date(),
      new Date(),
    );
    expect(() => recv.applyPayment(600)).toThrow(
      InvalidReceivablePaymentException,
    );
  });

  it('should throw if payment amount is zero', () => {
    const recv = new AccountsReceivable(
      'recv-4',
      'tenant-1',
      'cust-1',
      'sale-1',
      1000,
      500,
      new Date('2025-12-31'),
      'pending',
      null,
      new Date(),
      new Date(),
    );
    expect(() => recv.applyPayment(0)).toThrow(
      InvalidReceivablePaymentException,
    );
  });

  it('should throw if payment amount is negative', () => {
    const recv = new AccountsReceivable(
      'recv-5',
      'tenant-1',
      'cust-1',
      'sale-1',
      1000,
      500,
      new Date('2025-12-31'),
      'pending',
      null,
      new Date(),
      new Date(),
    );
    expect(() => recv.applyPayment(-100)).toThrow(
      InvalidReceivablePaymentException,
    );
  });

  it('should throw if receivable is already paid', () => {
    const recv = new AccountsReceivable(
      'recv-6',
      'tenant-1',
      'cust-1',
      'sale-1',
      500,
      0,
      new Date('2025-12-31'),
      'paid',
      null,
      new Date(),
      new Date(),
    );
    expect(() => recv.applyPayment(100)).toThrow(
      ReceivableAlreadyPaidException,
    );
  });
});
